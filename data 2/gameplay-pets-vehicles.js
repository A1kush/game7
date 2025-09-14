/**
 * A1K Runner - Gameplay: Pets & Vehicles
 * Grounded pets (unless flying), pet projectiles, Metal-Slug-style vehicles with seats, plus fusion mode.
 *
 * Features:
 * - Ground-locked pets with smart AI (projectile intercept -> enemy attack)
 * - Real projectile system with VFX animations
 * - Metal Slug style vehicle boarding with seat management
 * - Fusion mode that merges party into one powerful unit
 * - Progressive vehicle types: bike(1) -> motorcycle(2) -> car(3) -> fusion(3)
 */

(() => {
  "use strict";

  const G = (window.Game ||= {});

  // --- CONFIG ---
  const PET_GROUND_LOCK = true;
  const PET_FOLLOW_DIST = 72; // px behind owner
  const PET_TARGET_RANGE = 320; // px
  const PET_DASH_SPEED = 5.5; // px/frame for melee dash
  const PET_SHOOT_COOLDOWN = 18; // frames

  const VEH_TYPES = {
    bike: {
      seats: 1,
      speedMul: 1.25,
      armor: 0.9,
      icon: "assets/ui/veh_icon_bike_64.png",
    },
    motorcycle: {
      seats: 2,
      speedMul: 1.15,
      armor: 1.0,
      icon: "assets/ui/veh_icon_motorcycle_64.png",
    },
    car: {
      seats: 3,
      speedMul: 0.95,
      armor: 1.25,
      icon: "assets/ui/veh_icon_car_64.png",
    },
    fusion: {
      seats: 3,
      speedMul: 1.1,
      armor: 1.4,
      fusion: true,
      icon: "assets/ui/veh_icon_fusion_64.png",
    }, // merges the trio into one unit
  };

  // --- HELPERS ---
  const groundYAt = (x) =>
    typeof G.groundYAt === "function" ? G.groundYAt(x) : G.GROUND_Y || 540;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // --- VFX REGISTRATION (using the generated art) ---
  const VFX = (window.VFX ||= {
    sheets: {},
    activeEffects: [],
    spawn: (id, x, y, opt = {}) => {
      console.log(`🎆 VFX.spawn: ${id} at (${x}, ${y})`);

      const sheet = VFX.sheets[id];
      if (!sheet) {
        console.warn(`VFX sheet '${id}' not found`);
        return null;
      }

      const effect = {
        id,
        sheet,
        x,
        y,
        frame: 0,
        maxFrames: sheet.frames || 6,
        age: 0,
        angle: opt.angle || 0,
        target: opt.to || null,
        velocity: opt.velocity || { x: 0, y: 0 },
        lifespan: opt.lifespan || sheet.frames * 8, // frames to live
        ...opt,
      };

      // Calculate initial velocity if target is provided
      if (effect.target) {
        const dx = effect.target.x - x;
        const dy = effect.target.y - y;
        const dist = Math.hypot(dx, dy);
        const speed = opt.speed || 8;

        if (dist > 0) {
          effect.velocity.x = (dx / dist) * speed;
          effect.velocity.y = (dy / dist) * speed;
        }
      }

      VFX.activeEffects.push(effect);
      return effect;
    },

    update: () => {
      VFX.activeEffects = VFX.activeEffects.filter((effect) => {
        effect.age++;
        effect.frame = Math.floor((effect.age / 8) % effect.maxFrames);

        // Move projectile
        effect.x += effect.velocity.x;
        effect.y += effect.velocity.y;

        // Check collision with target
        if (effect.target) {
          const dist = distance(
            effect.x,
            effect.y,
            effect.target.x,
            effect.target.y
          );
          if (dist < 16) {
            // Hit target
            damageTarget(effect.target, 1.0, "pet_projectile");
            return false; // Remove effect
          }
        }

        return effect.age < effect.lifespan;
      });
    },

    render: (ctx) => {
      if (!ctx) return;

      VFX.activeEffects.forEach((effect) => {
        const sheet = effect.sheet;
        if (!sheet.image) return;

        const frameX = effect.frame * sheet.w;
        const frameY = 0;

        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.angle);
        ctx.drawImage(
          sheet.image,
          frameX,
          frameY,
          sheet.w,
          sheet.h,
          -sheet.w / 2,
          -sheet.h / 2,
          sheet.w,
          sheet.h
        );
        ctx.restore();
      });
    },
  });

  const registerIfMissing = (id, path, w = 64, h = 64, frames = 6) => {
    if (!VFX.sheets[id]) {
      const sheet = { path, w, h, frames };
      VFX.sheets[id] = sheet;

      // Load image
      const img = new Image();
      img.onload = () => {
        sheet.image = img;
        console.log(`✓ Loaded VFX sheet: ${id}`);
      };
      img.onerror = () => console.warn(`❌ Failed to load VFX sheet: ${path}`);
      img.src = path;
    }
  };

  // Register VFX sheets
  registerIfMissing(
    "pet_bolt_cyan",
    "assets/vfx/pet_bolt_cyan_strip6_64x64.png"
  );
  registerIfMissing(
    "pet_bolt_purple",
    "assets/vfx/pet_bolt_purple_strip6_64x64.png"
  );
  registerIfMissing("pet_claw_red", "assets/vfx/pet_claw_red_strip6_64x64.png");
  registerIfMissing(
    "pet_bubble_purple",
    "assets/vfx/pet_bubble_purple_strip6_64x64.png"
  );
  registerIfMissing(
    "pet_rock_chip",
    "assets/vfx/pet_rock_chip_strip6_64x64.png"
  );
  registerIfMissing(
    "pet_feather_slash",
    "assets/vfx/pet_feather_slash_strip6_64x64.png"
  );

  // --- PET SYSTEM ---
  class Pet {
    constructor({
      owner,
      kind = "wolf",
      flying = false,
      hp = 200,
      style = "bolt",
    }) {
      this.kind = kind;
      this.owner = owner;
      this.flying = flying;
      this.x = owner.x - 24;
      this.y =
        PET_GROUND_LOCK && !flying ? groundYAt(this.x) - 8 : owner.y - 10;
      this.hp = hp;
      this.maxHP = hp;
      this.cool = 0;
      this.style = style;
      this.speed = 2.8; // follow speed
      this.targetX = this.x;
      this.targetY = this.y;
      this.attackTarget = null;
      this.element = null;
      this.createVisual();

      console.log(`🐾 Pet spawned: ${kind} (${style}) with ${hp} HP`);
    }

    createVisual() {
      this.element = document.createElement("div");
      this.element.className = "pet-sprite";
      this.element.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        background: ${this.getStyleColor()};
        border-radius: 50%;
        z-index: 1000;
        transition: all 0.1s ease;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        pointer-events: none;
      `;

      // Add to game container
      const gameContainer = document.getElementById("wrap") || document.body;
      gameContainer.appendChild(this.element);
    }

    getStyleColor() {
      const colors = {
        bolt: "#00ffff", // Cyan
        bolt2: "#8000ff", // Purple
        bubble: "#ff00ff", // Magenta
        claw: "#ff4444", // Red
        rock: "#8b4513", // Brown
        feather: "#f0f0f0", // Light gray
      };
      return colors[this.style] || colors.bolt;
    }

    update() {
      if (this.hp <= 0) return;

      // Follow: drift to a point behind owner
      this.targetX = this.owner.x - PET_FOLLOW_DIST;
      this.targetY =
        PET_GROUND_LOCK && !this.flying
          ? groundYAt(this.targetX) - 8
          : this.owner.y - 10;

      // Smooth movement
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      this.x += clamp(dx, -this.speed, this.speed);
      this.y += clamp(dy, -this.speed, this.speed);

      // Update visual position
      if (this.element) {
        this.element.style.left = this.x + "px";
        this.element.style.top = this.y + "px";
      }

      // Targeting: enemy projectiles > nearest enemy
      const target = findThreatOrEnemy(this.x, this.y, PET_TARGET_RANGE);
      if (this.cool > 0) this.cool--;

      if (target && this.cool === 0) {
        this.attackTarget = target;

        if (this.style === "claw") {
          // Melee dash attack
          this.performMeleeAttack(target);
        } else {
          // Ranged attack
          this.performRangedAttack(target);
        }

        this.cool = PET_SHOOT_COOLDOWN;
      }
    }

    performMeleeAttack(target) {
      // Quick dash towards target
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        const dashX = (dx / dist) * PET_DASH_SPEED;
        const dashY = (dy / dist) * PET_DASH_SPEED;

        // Dash animation
        this.x += dashX * 3; // Quick dash
        this.y += dashY * 3;

        // Hit detection
        if (distance(this.x, this.y, target.x, target.y) < 20) {
          damageTarget(target, 1.2, "pet_melee"); // Higher melee damage
          VFX.spawn("pet_claw_red", this.x, this.y, {
            angle: Math.atan2(dy, dx),
          });
        }
      }
    }

    performRangedAttack(target) {
      shootPetProjectile(this, target, this.style);
    }

    destroy() {
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);

      // Visual feedback
      if (this.element) {
        this.element.style.background = "#ff4444";
        setTimeout(() => {
          if (this.element) {
            this.element.style.background = this.getStyleColor();
          }
        }, 200);
      }

      if (this.hp <= 0) {
        console.log(`💀 Pet ${this.kind} destroyed!`);
        this.destroy();
      }
    }
  }

  // Wire up global pet list
  G.pets ||= [];

  const addPet = (opt) => {
    const p = new Pet(opt);
    G.pets.push(p);
    return p;
  };

  G.spawnPet = ({
    hp = 200,
    flying = false,
    style = "bolt",
    owner = null,
  } = {}) => {
    owner ||= G.heroes ? G.heroes[0] : G.player || { x: 400, y: 300 };
    const p = addPet({ owner, hp, flying, style });

    // Fire custom event
    window.dispatchEvent(
      new CustomEvent("game:pet.spawned", { detail: { pet: p } })
    );

    return p;
  };

  // --- VEHICLE SYSTEM ---
  class Vehicle {
    constructor({ type = "car", x = 0, y = 0 }) {
      this.def = VEH_TYPES[type] || VEH_TYPES.car;
      this.type = type;
      this.x = x;
      this.y = groundYAt(x);
      this.occupants = []; // hero objects
      this.active = true;
      this.element = null;
      this.createVisual();

      console.log(`🚗 Vehicle spawned: ${type} (${this.def.seats} seats)`);
    }

    createVisual() {
      this.element = document.createElement("div");
      this.element.className = "vehicle-sprite";
      this.element.style.cssText = `
        position: absolute;
        width: 64px;
        height: 32px;
        background-image: url('${this.def.icon}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        z-index: 999;
        border: 2px solid #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        pointer-events: none;
        display: ${this.occupants.length > 0 ? "block" : "none"};
      `;

      const gameContainer = document.getElementById("wrap") || document.body;
      gameContainer.appendChild(this.element);

      this.updateVisualPosition();
    }

    updateVisualPosition() {
      if (this.element) {
        this.element.style.left = this.x - 32 + "px";
        this.element.style.top = this.y - 16 + "px";
        this.element.style.display =
          this.occupants.length > 0 ? "block" : "none";
      }
    }

    seatsFree() {
      return this.def.seats - this.occupants.length;
    }

    board(hero) {
      if (!this.active || this.seatsFree() <= 0) return false;

      this.occupants.push(hero);
      hero.hidden = true; // Hide while riding
      hero.vehicleX = this.x; // Store original position
      hero.vehicleY = this.y;

      if (this.def.fusion) {
        // Fusion mode: merge stats/auras
        G.speedMul = this.def.speedMul;
        G.armorMul = this.def.armor;
        console.log(
          `🔥 FUSION MODE ACTIVATED! Speed: ${this.def.speedMul}, Armor: ${this.def.armor}`
        );

        // Visual effect for fusion
        this.element.style.boxShadow = "0 0 20px #ff6600, 0 0 40px #ff6600aa";
      }

      this.updateVisualPosition();
      updateVehButton();

      console.log(
        `🚗 ${hero.id || "Hero"} boarded ${this.type} (${
          this.occupants.length
        }/${this.def.seats})`
      );
      return true;
    }

    unboard(hero) {
      const index = this.occupants.indexOf(hero);
      if (index === -1) return false;

      this.occupants.splice(index, 1);
      hero.hidden = false;
      hero.x = this.x + (Math.random() - 0.5) * 40; // Spread out when unboarding
      hero.y = this.y;

      if (this.def.fusion && this.occupants.length === 0) {
        G.speedMul = 1;
        G.armorMul = 1;
        console.log(`🔥 Fusion mode deactivated`);
        this.element.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
      }

      this.updateVisualPosition();
      updateVehButton();

      console.log(`🚗 ${hero.id || "Hero"} unboarded ${this.type}`);
      return true;
    }

    unboardAll() {
      const toUnboard = [...this.occupants];
      toUnboard.forEach((hero) => this.unboard(hero));
    }

    update() {
      if (this.occupants.length === 0) return;

      // Simple follow of input (you'd integrate with your actual input system)
      const input = G.input || window.input || {};
      const spd = 3.2 * (this.def.speedMul || 1);

      if (input.right || window.joyX > 0.3) {
        this.x += spd;
      }
      if (input.left || window.joyX < -0.3) {
        this.x -= spd;
      }

      this.y = groundYAt(this.x);

      // Update occupant positions
      this.occupants.forEach((hero) => {
        hero.x = this.x;
        hero.y = this.y;
      });

      this.updateVisualPosition();
    }

    destroy() {
      this.unboardAll();
      if (this.element) {
        this.element.remove();
        this.element = null;
      }
    }
  }

  G.vehicle = null;

  G.spawnVehicle = (type = "car") => {
    // Destroy existing vehicle
    if (G.vehicle) {
      G.vehicle.destroy();
    }

    const leader = G.heroes ? G.heroes[0] : G.player || { x: 400, y: 300 };
    G.vehicle = new Vehicle({ type, x: leader.x, y: leader.y });

    window.dispatchEvent(
      new CustomEvent("vehicle:spawn", { detail: { type } })
    );
    updateVehButton();

    return G.vehicle;
  };

  G.boardVehicle = () => {
    const v = G.vehicle;
    if (!v) return false;

    const heroes = (G.heroes || []).filter((h) => !h.hidden);
    let boarded = 0;

    for (const h of heroes) {
      if (v.seatsFree() > 0 && v.board(h)) {
        boarded++;
      }
    }

    if (boarded > 0) {
      console.log(`🚗 ${boarded} heroes boarded vehicle`);
      // Boarding animation effect
      if (v.element) {
        v.element.style.animation = "vehicleBoard 0.5s ease";
      }
    }

    return boarded > 0;
  };

  G.unboardVehicle = () => {
    if (G.vehicle) {
      G.vehicle.unboardAll();
      console.log(`🚗 All heroes unboarded`);
    }
  };

  // --- COMBAT SYSTEM INTEGRATION ---
  function findThreatOrEnemy(x, y, range) {
    const pick = (arr) =>
      arr &&
      arr.find((e) => {
        if (!e || e.dead || e.hp <= 0) return false;
        return Math.hypot(e.x - x, e.y - y) <= range;
      });

    // Priority: enemy projectiles first, then enemies
    return (
      pick(G.enemyProjectiles) || pick(G.enemies) || pick(window.gameEnemies)
    );
  }

  function damageTarget(target, multiplier, source) {
    if (!target || target.dead || target.hp <= 0) return;

    const baseDamage = target.baseDmg || 25;
    const damage = Math.round(baseDamage * multiplier);

    target.hp = Math.max(0, target.hp - damage);

    console.log(
      `💥 ${source} dealt ${damage} damage to target (${target.hp} HP remaining)`
    );

    // Create damage number effect
    if (typeof window.createDamageNumber === "function") {
      window.createDamageNumber(target.x, target.y, damage, "#36c777");
    }

    // Mark as dead if HP reaches 0
    if (target.hp <= 0) {
      target.dead = true;
      console.log(`💀 Target destroyed by ${source}`);
    }
  }

  function shootPetProjectile(pet, target, style) {
    const vfxMap = {
      bolt: "pet_bolt_cyan",
      bolt2: "pet_bolt_purple",
      bubble: "pet_bubble_purple",
      rock: "pet_rock_chip",
      feather: "pet_feather_slash",
      claw: "pet_claw_red", // Backup for claw style
    };

    const fx = vfxMap[style] || "pet_bolt_cyan";
    const angle = Math.atan2(target.y - pet.y, target.x - pet.x);

    VFX.spawn(fx, pet.x, pet.y - 10, {
      angle,
      to: target,
      speed: 8,
      lifespan: 60,
    });

    console.log(`🎯 Pet fired ${fx} projectile at target`);
  }

  // --- FRAME HOOK ---
  const origUpdate = G.update || (() => {});
  G.update = function () {
    origUpdate.apply(this, arguments);

    // Update pets
    G.pets = (G.pets || []).filter((pet) => {
      if (pet.hp <= 0) {
        pet.destroy();
        return false;
      }
      pet.update();
      return true;
    });

    // Update vehicle
    if (G.vehicle) {
      G.vehicle.update();
    }

    // Update VFX
    VFX.update();
  };

  // Hook into render if available
  const origRender = G.render || window.render || (() => {});
  const enhancedRender = function (ctx) {
    origRender.apply(this, arguments);

    // Render VFX
    if (ctx) {
      VFX.render(ctx);
    }
  };

  if (G.render) G.render = enhancedRender;
  if (window.render) window.render = enhancedRender;

  // --- UI INTEGRATION ---
  let pressTimer = null;

  function updateVehButton() {
    const btn = document.getElementById("btnCallVehicle");
    if (!btn) return;

    if (!G.vehicle) {
      btn.innerHTML = "Veh<br><small>---</small>";
      return;
    }

    const occupancy = `${G.vehicle.occupants.length}/${G.vehicle.def.seats}`;
    btn.innerHTML = `Veh<br><small>${occupancy}</small>`;

    // Change button color based on status
    if (G.vehicle.occupants.length > 0) {
      btn.style.background = G.vehicle.def.fusion ? "#ff6600" : "#00aa00";
    } else {
      btn.style.background = "";
    }
  }

  // Vehicle button logic
  const vehBtn = document.getElementById("btnCallVehicle");
  if (vehBtn) {
    // Long press detection
    vehBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      pressTimer = setTimeout(() => {
        // Long press: board/unboard
        if (!G.vehicle) {
          G.spawnVehicle("car");
        } else if (G.vehicle.occupants.length > 0) {
          G.unboardVehicle();
        } else {
          G.boardVehicle();
        }
        pressTimer = null;
      }, 420);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
      vehBtn.addEventListener(ev, () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      })
    );

    // Short tap: spawn or cycle vehicle type
    vehBtn.addEventListener("click", (e) => {
      if (pressTimer !== null) return; // Ignore if long press is active

      if (!G.vehicle) {
        G.spawnVehicle("car");
      } else {
        // Cycle through vehicle types
        const order = ["car", "motorcycle", "bike", "fusion"];
        const currentIndex = order.indexOf(G.vehicle.type);
        const nextIndex = (currentIndex + 1) % order.length;
        const nextType = order[nextIndex];

        console.log(`🚗 Cycling vehicle: ${G.vehicle.type} -> ${nextType}`);
        G.spawnVehicle(nextType);
      }
    });
  }

  // Pet button logic
  const petBtn = document.getElementById("btnSummonPet");
  const updatePetBtn = () => {
    if (!petBtn) return;
    const count = (G.pets || []).length;
    petBtn.innerHTML = `Pet<br><small>${count}/3</small>`;

    if (count >= 3) {
      petBtn.style.background = "#666";
    } else {
      petBtn.style.background = "";
    }
  };

  if (petBtn) {
    petBtn.addEventListener("click", () => {
      if ((G.pets || []).length < 3) {
        const styles = ["bolt", "claw", "bubble"];
        const style = styles[G.pets.length % styles.length];

        G.spawnPet({
          hp: 200,
          flying: style === "feather", // Feather pets can fly
          style,
        });

        updatePetBtn();

        // Show toast
        if (window.A1K_UI && window.A1K_UI.showToast) {
          window.A1K_UI.showToast(`Pet summoned! (${style})`, "success");
        }
      } else {
        if (window.A1K_UI && window.A1K_UI.showToast) {
          window.A1K_UI.showToast("Maximum pets reached!", "error");
        }
      }
    });
  }

  // UI update interval
  setInterval(() => {
    updateVehButton();
    updatePetBtn();
  }, 300);

  // --- CSS ANIMATIONS ---
  if (!document.getElementById("pets-vehicles-css")) {
    const style = document.createElement("style");
    style.id = "pets-vehicles-css";
    style.textContent = `
      @keyframes vehicleBoard {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .pet-sprite {
        animation: petFloat 2s ease-in-out infinite alternate;
      }
      
      @keyframes petFloat {
        0% { transform: translateY(0px); }
        100% { transform: translateY(-4px); }
      }
    `;
    document.head.appendChild(style);
  }

  // --- INITIALIZATION ---
  console.log("🎮 Gameplay: Pets & Vehicles system loaded!");
  console.log("🐾 Pet controls: Click Pet button to summon (max 3)");
  console.log(
    "🚗 Vehicle controls: Short tap = cycle type, Long press = board/unboard"
  );

  // Initialize UI
  setTimeout(() => {
    updateVehButton();
    updatePetBtn();
  }, 100);

  // Global API
  window.PetsVehicles = {
    Pet,
    Vehicle,
    VFX,
    spawnPet: G.spawnPet,
    spawnVehicle: G.spawnVehicle,
    boardVehicle: G.boardVehicle,
    unboardVehicle: G.unboardVehicle,
  };
})();
