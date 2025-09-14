/**
 * A1K Runner - Enhanced Pets & Vehicles System
 * Complete implementation based on detailed specifications:
 * - Pet positioning (beside/above/around owners, flight rules)
 * - Pet lifecycle (2min duration, 100 HP, cooldowns)
 * - Pet triggers (auto-activate on Skill 3/4/5)
 * - Power tiers (C/B: 10-30%, A-SS: 40-50%)
 * - Equipment & Inventory UI (drag-drop, character tabs)
 * - Vehicle mounting (on top/inside, fuel system)
 * - Pet controls (Pet Off button, triple-tap recall)
 */

(() => {
  "use strict";

  const G = (window.Game ||= {});

  // === CORE CONFIGURATION ===
  const CONFIG = {
    PET: {
      MAX_PER_OWNER: 1,
      MAX_TOTAL: 3, // Party of 3 = 1 pet per character
      LIFESPAN_MS: 120000, // 2 minutes
      MAX_HP: 100,
      FOLLOW_DISTANCE: 80,
      POSITIONING: {
        BESIDE_OFFSET: { x: 40, y: 0 },
        ABOVE_OFFSET: { x: 0, y: -50 },
        AROUND_RADIUS: 60,
      },
      COOLDOWN_MS: 60000, // 1 minute cooldown after despawn
      POWER_TIERS: {
        C: { minDamage: 0.1, maxDamage: 0.2, level30Bonus: 0.1 },
        B: { minDamage: 0.15, maxDamage: 0.3, level30Bonus: 0.15 },
        A: { minDamage: 0.4, maxDamage: 0.45, cooldown: 60000 },
        S: { minDamage: 0.45, maxDamage: 0.5, cooldown: 50000 },
        SS: { minDamage: 0.5, maxDamage: 0.55, cooldown: 40000 },
      },
    },
    VEHICLE: {
      FUEL_BASELINE: 30000, // 30-50s baseline
      FUEL_MAX: 50000,
      FUEL_UPGRADE_PER_10_LEVELS: {
        C: 5000, // +5s per 10 levels
        B: 7000,
        A: 10000,
        S: 12000,
        SS: 15000,
      },
      FUEL_TANK_COST: 200, // 200 gold shop upgrade
      NO_SHIELD: true,
    },
    TRIGGERS: {
      SKILL_3: true,
      SKILL_4: true,
      SKILL_5: true,
    },
  };

  // === PET SYSTEM ===
  class Pet {
    constructor(owner, species, rank = "B", level = 1) {
      this.id = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.owner = owner; // Player object
      this.species = species; // 'bird', 'dragon', 'wolf', etc.
      this.rank = rank; // C, B, A, S, SS
      this.level = level;
      this.hp = CONFIG.PET.MAX_HP;
      this.maxHp = CONFIG.PET.MAX_HP;

      // Position and movement
      this.x = owner.x || 0;
      this.y = owner.y || 0;
      this.targetX = this.x;
      this.targetY = this.y;
      this.canFly = this.isFlying();

      // Lifecycle
      this.spawnTime = Date.now();
      this.lastSkillUse = 0;
      this.isDespawning = false;

      // Visual
      this.sprite = null;
      this.createSprite();

      // Add to global tracking
      G.pets = G.pets || [];
      G.pets.push(this);

      console.log(
        `🐾 Pet spawned: ${species} (${rank}) for ${owner.name || "Player"}`
      );
    }

    isFlying() {
      // Only birds, planes, jetpacks, vehicles may fly
      const flyingSpecies = [
        "bird",
        "dragon",
        "fairy",
        "phoenix",
        "plane",
        "jetpack",
      ];
      return flyingSpecies.includes(this.species.toLowerCase());
    }

    getPositionType() {
      // Determine positioning based on species/type
      const positionTypes = {
        wolf: "beside",
        cat: "beside",
        dog: "beside",
        bird: "above",
        dragon: "above",
        fairy: "around",
        spirit: "around",
      };
      return positionTypes[this.species.toLowerCase()] || "beside";
    }

    updatePosition() {
      if (!this.owner) return;

      const posType = this.getPositionType();
      let offsetX = 0,
        offsetY = 0;

      switch (posType) {
        case "beside":
          offsetX = CONFIG.PET.POSITIONING.BESIDE_OFFSET.x;
          offsetY = CONFIG.PET.POSITIONING.BESIDE_OFFSET.y;
          break;
        case "above":
          offsetX = CONFIG.PET.POSITIONING.ABOVE_OFFSET.x;
          offsetY = CONFIG.PET.POSITIONING.ABOVE_OFFSET.y;
          break;
        case "around":
          // Circular orbit around owner
          const angle = (Date.now() / 2000) % (Math.PI * 2);
          offsetX = Math.cos(angle) * CONFIG.PET.POSITIONING.AROUND_RADIUS;
          offsetY = Math.sin(angle) * CONFIG.PET.POSITIONING.AROUND_RADIUS;
          break;
      }

      this.targetX = (this.owner.x || 0) + offsetX;
      this.targetY = (this.owner.y || 0) + offsetY;

      // Ground lock for non-flying pets
      if (!this.canFly && this.owner.groundY) {
        this.targetY = Math.max(this.targetY, this.owner.groundY - 20);
      }

      // Smooth movement toward target
      const speed = 0.15;
      this.x += (this.targetX - this.x) * speed;
      this.y += (this.targetY - this.y) * speed;

      // Update sprite position
      if (this.sprite) {
        this.sprite.style.left = this.x + "px";
        this.sprite.style.top = this.y + "px";
      }
    }

    calculateDamage(enemyMaxHp) {
      const tier = CONFIG.PET.POWER_TIERS[this.rank];
      if (!tier) return enemyMaxHp * 0.1; // Fallback

      let baseDamage;
      if (this.level >= 30 && (this.rank === "C" || this.rank === "B")) {
        // Level 30 bonus for lower tiers
        baseDamage =
          tier.minDamage +
          tier.level30Bonus +
          Math.random() * (tier.maxDamage - tier.minDamage);
      } else {
        baseDamage =
          tier.minDamage + Math.random() * (tier.maxDamage - tier.minDamage);
      }

      return Math.floor(enemyMaxHp * baseDamage);
    }

    useSkill(target) {
      const now = Date.now();
      const tier = CONFIG.PET.POWER_TIERS[this.rank];
      const cooldown = tier.cooldown || 10000; // Default 10s for C/B ranks

      if (now - this.lastSkillUse < cooldown) {
        return false; // Still on cooldown
      }

      this.lastSkillUse = now;

      if (!target) return false;

      // Calculate and apply damage
      const damage = this.calculateDamage(target.maxHp || target.hp || 100);
      target.hp = Math.max(0, (target.hp || 100) - damage);

      // Visual feedback
      this.showSkillEffect(target, damage);

      console.log(
        `🎯 ${this.species} (${this.rank}) deals ${damage} damage to enemy`
      );
      return true;
    }

    showSkillEffect(target, damage) {
      // Create floating damage number
      const damageText = document.createElement("div");
      damageText.textContent = `-${damage}`;
      damageText.style.cssText = `
        position: absolute;
        left: ${target.x || this.x + 30}px;
        top: ${target.y || this.y - 20}px;
        color: #ff6b6b;
        font-weight: bold;
        font-size: 18px;
        z-index: 1000;
        pointer-events: none;
        animation: floatDamage 1.5s ease-out forwards;
      `;

      document.body.appendChild(damageText);
      setTimeout(() => damageText.remove(), 1500);
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);

      if (this.hp <= 0) {
        this.despawn("hp_lost");
        return true; // Pet died
      }

      // Update HP bar if exists
      this.updateHpBar();
      return false;
    }

    updateHpBar() {
      if (!this.sprite) return;

      let hpBar = this.sprite.querySelector(".pet-hp-bar");
      if (!hpBar) {
        hpBar = document.createElement("div");
        hpBar.className = "pet-hp-bar";
        hpBar.style.cssText = `
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        `;

        const hpFill = document.createElement("div");
        hpFill.className = "pet-hp-fill";
        hpFill.style.cssText = `
          height: 100%;
          background: #4CAF50;
          transition: width 0.3s ease;
          width: 100%;
        `;

        hpBar.appendChild(hpFill);
        this.sprite.appendChild(hpBar);
      }

      const hpFill = hpBar.querySelector(".pet-hp-fill");
      const hpPercent = (this.hp / this.maxHp) * 100;
      hpFill.style.width = hpPercent + "%";

      if (hpPercent > 60) hpFill.style.background = "#4CAF50";
      else if (hpPercent > 30) hpFill.style.background = "#FFA726";
      else hpFill.style.background = "#F44336";
    }

    createSprite() {
      this.sprite = document.createElement("div");
      this.sprite.className = "pet-sprite";
      this.sprite.style.cssText = `
        position: absolute;
        width: 32px;
        height: 32px;
        background: radial-gradient(circle, #4CAF50, #2E7D32);
        border-radius: 50%;
        border: 2px solid #81C784;
        z-index: 500;
        transition: transform 0.2s ease;
        cursor: pointer;
      `;

      // Species-specific styling
      this.applySpeciesStyle();

      // Add to game container
      const gameContainer =
        document.querySelector("#gameContainer") || document.body;
      gameContainer.appendChild(this.sprite);

      // Click handler for manual control
      this.sprite.addEventListener("click", () => {
        console.log(
          `🐾 ${this.species} clicked - HP: ${this.hp}/${this.maxHp}`
        );
      });
    }

    applySpeciesStyle() {
      if (!this.sprite) return;

      const styles = {
        bird: "background: radial-gradient(circle, #2196F3, #1565C0); animation: petFly 1s ease-in-out infinite alternate;",
        dragon:
          "background: radial-gradient(circle, #F44336, #C62828); border-color: #FFAB91;",
        wolf: "background: radial-gradient(circle, #795548, #4E342E); border-color: #A1887F;",
        cat: "background: radial-gradient(circle, #FF9800, #E65100); border-color: #FFCC02;",
        fairy:
          "background: radial-gradient(circle, #E91E63, #AD1457); animation: petSparkle 2s ease-in-out infinite;",
      };

      const speciesStyle = styles[this.species.toLowerCase()];
      if (speciesStyle) {
        this.sprite.style.cssText += speciesStyle;
      }
    }

    update() {
      // Check lifespan
      const now = Date.now();
      if (now - this.spawnTime > CONFIG.PET.LIFESPAN_MS) {
        this.despawn("lifespan");
        return;
      }

      // Update position
      this.updatePosition();

      // Auto-trigger skill check
      this.checkAutoTrigger();
    }

    checkAutoTrigger() {
      // Check if owner is using Skill 3/4/5
      if (!this.owner || !this.owner.isUsingSkill) return;

      const skillNum = this.owner.currentSkill;
      if ([3, 4, 5].includes(skillNum)) {
        // Find nearby enemy
        const enemies = G.enemies || [];
        const nearestEnemy = this.findNearestEnemy(enemies);
        if (nearestEnemy) {
          this.useSkill(nearestEnemy);
        }
      }
    }

    findNearestEnemy(enemies) {
      let nearest = null;
      let minDist = Infinity;

      enemies.forEach((enemy) => {
        if (!enemy.x || !enemy.y || enemy.hp <= 0) return;

        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist && dist < 300) {
          // 300px max range
          minDist = dist;
          nearest = enemy;
        }
      });

      return nearest;
    }

    despawn(reason = "manual") {
      if (this.isDespawning) return;
      this.isDespawning = true;

      console.log(`🐾 Pet despawning: ${this.species} (${reason})`);

      // Remove sprite
      if (this.sprite) {
        this.sprite.style.animation = "petDespawn 0.5s ease-in forwards";
        setTimeout(() => {
          if (this.sprite && this.sprite.parentNode) {
            this.sprite.parentNode.removeChild(this.sprite);
          }
        }, 500);
      }

      // Start cooldown for owner
      if (this.owner) {
        this.owner.petCooldownUntil = Date.now() + CONFIG.PET.COOLDOWN_MS;
      }

      // Remove from global tracking
      if (G.pets) {
        const index = G.pets.indexOf(this);
        if (index > -1) G.pets.splice(index, 1);
      }

      // Update UI
      updatePetUI();
    }
  }

  // === VEHICLE SYSTEM ===
  class Vehicle {
    constructor(type = "bike", level = 1, rank = "C") {
      this.id = `vehicle_${Date.now()}`;
      this.type = type;
      this.level = level;
      this.rank = rank;
      this.riders = [];
      this.maxRiders = this.getMaxRiders();

      // Fuel system
      this.fuel = CONFIG.VEHICLE.FUEL_BASELINE;
      this.maxFuel = this.calculateMaxFuel();
      this.fuelTankUpgrade = false;

      // Position and visual
      this.x = 0;
      this.y = 0;
      this.sprite = null;
      this.createSprite();

      // Add to global tracking
      G.vehicles = G.vehicles || [];
      G.vehicles.push(this);

      console.log(`🚗 Vehicle spawned: ${type} (${rank}, Level ${level})`);
    }

    getMaxRiders() {
      const riderCounts = {
        bike: 1,
        motorcycle: 2,
        car: 3,
        hoverboard: 1,
        jetpack: 1,
      };
      return riderCounts[this.type] || 1;
    }

    calculateMaxFuel() {
      const baseUpgrade =
        CONFIG.VEHICLE.FUEL_UPGRADE_PER_10_LEVELS[this.rank] || 5000;
      const levelBonus = Math.floor(this.level / 10) * baseUpgrade;
      let totalFuel = CONFIG.VEHICLE.FUEL_BASELINE + levelBonus;

      // Fuel tank shop upgrade
      if (this.fuelTankUpgrade) {
        totalFuel += 10000; // +10s from 200 gold upgrade
      }

      return Math.min(totalFuel, CONFIG.VEHICLE.FUEL_MAX);
    }

    mount(player) {
      if (this.riders.length >= this.maxRiders) {
        console.log(`🚗 Vehicle full: ${this.riders.length}/${this.maxRiders}`);
        return false;
      }

      if (this.riders.includes(player)) {
        console.log(`🚗 Player already mounted`);
        return false;
      }

      this.riders.push(player);
      player.vehicle = this;
      player.mountedVehicle = this.type;

      // Position player on/in vehicle
      this.positionRider(player);

      console.log(
        `🚗 Player mounted ${this.type} (${this.riders.length}/${this.maxRiders})`
      );
      this.updateSprite();
      return true;
    }

    dismount(player) {
      const index = this.riders.indexOf(player);
      if (index === -1) return false;

      this.riders.splice(index, 1);
      player.vehicle = null;
      player.mountedVehicle = null;

      console.log(`🚗 Player dismounted ${this.type}`);
      this.updateSprite();

      // If empty, start despawn timer
      if (this.riders.length === 0) {
        setTimeout(() => {
          if (this.riders.length === 0) {
            this.despawn("empty");
          }
        }, 30000); // 30s idle despawn
      }

      return true;
    }

    positionRider(player) {
      // Position logic based on vehicle type
      const positions = {
        bike: { x: 0, y: -10 }, // Stand on bike
        motorcycle: { x: 0, y: -15 }, // Sit on motorcycle
        car: { x: 0, y: -20 }, // Inside car
        hoverboard: { x: 0, y: -5 }, // Stand on hoverboard
        jetpack: { x: 0, y: 0 }, // Wear jetpack
      };

      const pos = positions[this.type] || { x: 0, y: -10 };
      const riderIndex = this.riders.indexOf(player);

      // Spread multiple riders
      player.vehicleOffsetX = pos.x + (riderIndex - 1) * 15;
      player.vehicleOffsetY = pos.y;

      console.log(
        `🚗 Player positioned on ${this.type}: (${player.vehicleOffsetX}, ${player.vehicleOffsetY})`
      );
    }

    consumeFuel(deltaTime) {
      if (this.riders.length === 0) return true; // No fuel consumption when empty

      this.fuel = Math.max(0, this.fuel - deltaTime);

      if (this.fuel <= 0) {
        console.log(`🚗 ${this.type} out of fuel!`);
        this.ejectAllRiders();
        this.despawn("fuel");
        return false;
      }

      return true;
    }

    ejectAllRiders() {
      [...this.riders].forEach((rider) => {
        this.dismount(rider);
      });
    }

    createSprite() {
      this.sprite = document.createElement("div");
      this.sprite.className = "vehicle-sprite";
      this.sprite.style.cssText = `
        position: absolute;
        width: 64px;
        height: 32px;
        background: url('assets/ui/veh_icon_${this.type}_64.png') no-repeat center;
        background-size: contain;
        z-index: 400;
        transition: transform 0.2s ease;
      `;

      const gameContainer =
        document.querySelector("#gameContainer") || document.body;
      gameContainer.appendChild(this.sprite);
    }

    updateSprite() {
      if (!this.sprite) return;

      // Update position
      this.sprite.style.left = this.x + "px";
      this.sprite.style.top = this.y + "px";

      // Fuel indicator
      let fuelBar = this.sprite.querySelector(".vehicle-fuel-bar");
      if (!fuelBar) {
        fuelBar = document.createElement("div");
        fuelBar.className = "vehicle-fuel-bar";
        fuelBar.style.cssText = `
          position: absolute;
          top: -8px;
          left: 0;
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          overflow: hidden;
        `;

        const fuelFill = document.createElement("div");
        fuelFill.className = "vehicle-fuel-fill";
        fuelFill.style.cssText = `
          height: 100%;
          background: #2196F3;
          transition: width 0.3s ease;
        `;

        fuelBar.appendChild(fuelFill);
        this.sprite.appendChild(fuelBar);
      }

      const fuelFill = fuelBar.querySelector(".vehicle-fuel-fill");
      const fuelPercent = (this.fuel / this.maxFuel) * 100;
      fuelFill.style.width = fuelPercent + "%";

      if (fuelPercent > 60) fuelFill.style.background = "#4CAF50";
      else if (fuelPercent > 30) fuelFill.style.background = "#FFA726";
      else fuelFill.style.background = "#F44336";
    }

    update(deltaTime) {
      if (!this.consumeFuel(deltaTime)) return;

      // Update position based on primary rider
      if (this.riders.length > 0) {
        const primaryRider = this.riders[0];
        this.x = primaryRider.x || 0;
        this.y = (primaryRider.y || 0) + 20; // Vehicle below player
      }

      this.updateSprite();
    }

    despawn(reason = "manual") {
      console.log(`🚗 Vehicle despawning: ${this.type} (${reason})`);

      this.ejectAllRiders();

      if (this.sprite) {
        this.sprite.style.animation = "vehicleDespawn 0.5s ease-in forwards";
        setTimeout(() => {
          if (this.sprite && this.sprite.parentNode) {
            this.sprite.parentNode.removeChild(this.sprite);
          }
        }, 500);
      }

      if (G.vehicles) {
        const index = G.vehicles.indexOf(this);
        if (index > -1) G.vehicles.splice(index, 1);
      }

      updateVehicleUI();
    }
  }

  // === EQUIPMENT & INVENTORY UI ===
  function createEquipmentUI() {
    const equipPanel = document.createElement("div");
    equipPanel.id = "equipment-panel";
    equipPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      height: 400px;
      background: rgba(18, 27, 32, 0.95);
      border: 2px solid #293854;
      border-radius: 8px;
      padding: 10px;
      z-index: 1000;
      display: none;
    `;

    // Character tabs
    const charTabs = document.createElement("div");
    charTabs.className = "char-tabs";
    charTabs.style.cssText = `
      display: flex;
      margin-bottom: 10px;
      border-bottom: 1px solid #293854;
    `;

    ["Player 1", "Player 2", "Player 3"].forEach((name, index) => {
      const tab = document.createElement("button");
      tab.textContent = name;
      tab.className = "char-tab";
      tab.style.cssText = `
        flex: 1;
        padding: 8px;
        background: ${index === 0 ? "#293854" : "transparent"};
        color: #e9f4ff;
        border: none;
        border-radius: 4px 4px 0 0;
        cursor: pointer;
        transition: background 0.2s ease;
      `;

      tab.addEventListener("click", () => switchCharacterTab(index));
      charTabs.appendChild(tab);
    });

    equipPanel.appendChild(charTabs);

    // Equipment slots (paper doll)
    const equipGrid = document.createElement("div");
    equipGrid.className = "equip-grid";
    equipGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    `;

    const slotNames = [
      "Helmet",
      "Armor",
      "Boots",
      "Weapon",
      "Accessory",
      "Pet",
    ];
    slotNames.forEach((slotName) => {
      const slot = document.createElement("div");
      slot.className = "equip-slot";
      slot.dataset.slot = slotName.toLowerCase();
      slot.style.cssText = `
        width: 60px;
        height: 60px;
        background: rgba(41, 56, 84, 0.5);
        border: 2px dashed #293854;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #a8b7ce;
        cursor: pointer;
        position: relative;
      `;

      const label = document.createElement("div");
      label.textContent = slotName;
      label.style.fontSize = "8px";
      slot.appendChild(label);

      setupDropZone(slot);
      equipGrid.appendChild(slot);
    });

    equipPanel.appendChild(equipGrid);

    // Per-character gear inventory (10 slots)
    const invLabel = document.createElement("div");
    invLabel.textContent = "Gear Inventory";
    invLabel.style.cssText = "margin:6px 0;color:#a8b7ce;font-size:11px;";
    equipPanel.appendChild(invLabel);

    const invGrid = document.createElement("div");
    invGrid.className = "gear-inv-grid";
    invGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    `;

    for (let i = 0; i < 10; i++) {
      const slot = document.createElement("div");
      slot.className = "gear-inv-slot";
      slot.dataset.index = i;
      slot.style.cssText = `
        width: 52px; height: 52px; background: rgba(41,56,84,0.35);
        border: 1px dashed #293854; border-radius: 4px; position: relative; cursor: pointer;`;
      setupDropZone(slot);
      invGrid.appendChild(slot);
    }

    equipPanel.appendChild(invGrid);

    // Live stats display
    const statsDisplay = document.createElement("div");
    statsDisplay.className = "stats-display";
    statsDisplay.style.cssText = `
      background: rgba(41, 56, 84, 0.3);
      padding: 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #e9f4ff;
    `;
    statsDisplay.innerHTML = `
      <div>ATK: <span id="stat-atk">100</span></div>
      <div>DEF: <span id="stat-def">50</span></div>
      <div>SPD: <span id="stat-spd">75</span></div>
    `;

    equipPanel.appendChild(statsDisplay);
    document.body.appendChild(equipPanel);

    // Toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = "EQUIP";
    toggleBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 320px;
      padding: 8px 12px;
      background: #293854;
      color: #e9f4ff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      z-index: 1001;
    `;

    toggleBtn.addEventListener("click", () => {
      const isVisible = equipPanel.style.display !== "none";
      equipPanel.style.display = isVisible ? "none" : "block";
      toggleBtn.textContent = isVisible ? "EQUIP" : "CLOSE";
    });

    document.body.appendChild(toggleBtn);
  }

  function setupDropZone(slot) {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.style.borderColor = "#4CAF50";
    });

    slot.addEventListener("dragleave", () => {
      slot.style.borderColor = "#293854";
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.style.borderColor = "#293854";

      const itemData = e.dataTransfer.getData("text/plain");
      if (itemData) {
        equipItem(slot, JSON.parse(itemData));
      }
    });

    slot.addEventListener("click", () => {
      // Show item details or unequip
      const equipped = slot.querySelector(".equipped-item");
      if (equipped) {
        unequipItem(slot);
      }
    });
  }

  function equipItem(slot, itemData) {
    // Clear existing item
    const existing = slot.querySelector(".equipped-item");
    if (existing) existing.remove();

    // Create equipped item visual
    const itemDiv = document.createElement("div");
    itemDiv.className = "equipped-item";
    itemDiv.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url('${itemData.icon}') center/contain no-repeat;
      border-radius: 4px;
      cursor: pointer;
    `;

    slot.appendChild(itemDiv);
    slot.style.borderColor = "#4CAF50";

    // Update stats live
    updateCharacterStats();

    console.log(`⚔️ Equipped ${itemData.name} to ${slot.dataset.slot}`);
  }

  function unequipItem(slot) {
    const equipped = slot.querySelector(".equipped-item");
    if (equipped) {
      equipped.remove();
      slot.style.borderColor = "#293854";
      updateCharacterStats();
      console.log(`⚔️ Unequipped item from ${slot.dataset.slot}`);
    }
  }

  function switchCharacterTab(index) {
    document.querySelectorAll(".char-tab").forEach((tab, i) => {
      tab.style.background = i === index ? "#293854" : "transparent";
    });

    // Load character's equipment
    loadCharacterEquipment(index);
    console.log(`👤 Switched to character ${index + 1}`);
  }

  function loadCharacterEquipment(characterIndex) {
    // Load saved equipment for this character
    const savedEquipment = JSON.parse(
      localStorage.getItem(`char_${characterIndex}_equipment`) || "{}"
    );

    document.querySelectorAll(".equip-slot").forEach((slot) => {
      const existing = slot.querySelector(".equipped-item");
      if (existing) existing.remove();

      const slotType = slot.dataset.slot;
      if (savedEquipment[slotType]) {
        equipItem(slot, savedEquipment[slotType]);
      }
    });
  }

  function updateCharacterStats() {
    // Recalculate stats based on equipped items
    let totalAtk = 100,
      totalDef = 50,
      totalSpd = 75;

    document.querySelectorAll(".equipped-item").forEach((item) => {
      // Add item stats (would be read from item data)
      totalAtk += 10;
      totalDef += 5;
      totalSpd += 2;
    });

    document.getElementById("stat-atk").textContent = totalAtk;
    document.getElementById("stat-def").textContent = totalDef;
    document.getElementById("stat-spd").textContent = totalSpd;

    // Apply stats to character in real-time
    if (G.player) {
      G.player.attack = totalAtk;
      G.player.defense = totalDef;
      G.player.speed = totalSpd;
    }
  }

  // === PET & VEHICLE CONTROLS ===
  function createPetControls() {
    const controlsDiv = document.createElement("div");
    controlsDiv.id = "pet-controls";
    controlsDiv.style.cssText = `
      position: fixed;
      bottom: 200px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    `;

    // Pet button
    const petBtn = document.createElement("button");
    petBtn.id = "pet-btn";
    petBtn.textContent = "PET (0/3)";
    petBtn.style.cssText = `
      width: 80px;
      height: 40px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    petBtn.addEventListener("click", spawnPet);
    controlsDiv.appendChild(petBtn);

    // Pet Off button
    const petOffBtn = document.createElement("button");
    petOffBtn.id = "pet-off-btn";
    petOffBtn.textContent = "PET OFF";
    petOffBtn.style.cssText = `
      width: 80px;
      height: 32px;
      background: #F44336;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 10px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    petOffBtn.addEventListener("click", recallAllPets);
    controlsDiv.appendChild(petOffBtn);

    // Vehicle button
    const vehBtn = document.createElement("button");
    vehBtn.id = "vehicle-btn";
    vehBtn.textContent = "BIKE";
    vehBtn.style.cssText = `
      width: 80px;
      height: 40px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
    `;

    // Short tap = cycle, long press = board/unboard
    let pressTimer;
    vehBtn.addEventListener("mousedown", () => {
      pressTimer = setTimeout(() => {
        toggleVehicleBoarding();
      }, 500); // 500ms long press
    });

    vehBtn.addEventListener("mouseup", () => {
      clearTimeout(pressTimer);
    });

    vehBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setTimeout(() => {
        cycleVehicleType();
      }, 10);
    });

    controlsDiv.appendChild(vehBtn);

    document.body.appendChild(controlsDiv);

    // Triple-tap detection for pet recall
    let tapCount = 0;
    let tapTimer;

    document.addEventListener("click", (e) => {
      if (e.target.closest("#pet-controls")) {
        tapCount++;
        clearTimeout(tapTimer);

        tapTimer = setTimeout(() => {
          if (tapCount >= 3) {
            recallAllPets();
          }
          tapCount = 0;
        }, 500);
      }
    });
  }

  function spawnPet() {
    const pets = G.pets || [];
    const players = G.party || [G.player].filter(Boolean);

    if (pets.length >= CONFIG.PET.MAX_TOTAL) {
      console.log(`🐾 Max pets reached (${CONFIG.PET.MAX_TOTAL})`);
      return;
    }

    // Find player without pet
    const availablePlayer = players.find((player) => {
      return !pets.some((pet) => pet.owner === player);
    });

    if (!availablePlayer) {
      console.log("🐾 All players already have pets");
      return;
    }

    // Check cooldown
    if (
      availablePlayer.petCooldownUntil &&
      Date.now() < availablePlayer.petCooldownUntil
    ) {
      const remaining = Math.ceil(
        (availablePlayer.petCooldownUntil - Date.now()) / 1000
      );
      console.log(`🐾 Pet cooldown: ${remaining}s remaining`);
      return;
    }

    // Create pet
    const species = ["wolf", "cat", "bird", "dragon", "fairy"][
      Math.floor(Math.random() * 5)
    ];
    const rank = ["C", "B", "A", "S", "SS"][Math.floor(Math.random() * 5)];
    const level = Math.floor(Math.random() * 50) + 1;

    new Pet(availablePlayer, species, rank, level);
    updatePetUI();
  }

  function recallAllPets() {
    const pets = G.pets || [];
    console.log(`🐾 Recalling ${pets.length} pets`);

    [...pets].forEach((pet) => {
      pet.despawn("recalled");
    });

    updatePetUI();
  }

  let currentVehicleType = 0;
  const vehicleTypes = ["bike", "motorcycle", "car", "hoverboard", "jetpack"];

  function cycleVehicleType() {
    currentVehicleType = (currentVehicleType + 1) % vehicleTypes.length;
    const newType = vehicleTypes[currentVehicleType];

    const vehBtn = document.getElementById("vehicle-btn");
    if (vehBtn) {
      vehBtn.textContent = newType.toUpperCase();
    }

    console.log(`🚗 Vehicle type: ${newType}`);
  }

  function toggleVehicleBoarding() {
    const player = G.player;
    if (!player) return;

    if (player.vehicle) {
      // Dismount
      player.vehicle.dismount(player);
      console.log("🚗 Dismounted vehicle");
    } else {
      // Mount or create vehicle
      let vehicle =
        G.vehicles && G.vehicles.find((v) => v.riders.length < v.maxRiders);

      if (!vehicle) {
        const currentType = vehicleTypes[currentVehicleType];
        const rank = ["C", "B", "A"][Math.floor(Math.random() * 3)];
        const level = Math.floor(Math.random() * 30) + 1;
        vehicle = new Vehicle(currentType, level, rank);
      }

      vehicle.mount(player);
      console.log(`🚗 Mounted ${vehicle.type}`);
    }

    updateVehicleUI();
  }

  function updatePetUI() {
    const petBtn = document.getElementById("pet-btn");
    if (!petBtn) return;

    const petCount = (G.pets || []).length;
    petBtn.textContent = `PET (${petCount}/${CONFIG.PET.MAX_TOTAL})`;

    if (petCount === 0) {
      petBtn.style.background = "#4CAF50";
    } else if (petCount < CONFIG.PET.MAX_TOTAL) {
      petBtn.style.background = "#FFA726";
    } else {
      petBtn.style.background = "#F44336";
    }
  }

  function updateVehicleUI() {
    const vehBtn = document.getElementById("vehicle-btn");
    if (!vehBtn) return;

    const player = G.player;
    if (player && player.vehicle) {
      vehBtn.style.background = "#4CAF50";
      vehBtn.textContent = `${player.vehicle.type.toUpperCase()} ✓`;
    } else {
      vehBtn.style.background = "#2196F3";
      vehBtn.textContent = vehicleTypes[currentVehicleType].toUpperCase();
    }
  }

  // === MAIN UPDATE LOOP ===
  function gameUpdate(deltaTime = 16) {
    // Update pets
    if (G.pets) {
      G.pets.forEach((pet) => pet.update());
    }

    // Update vehicles
    if (G.vehicles) {
      G.vehicles.forEach((vehicle) => vehicle.update(deltaTime));
    }
  }

  // === STYLE INJECTION ===
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes petFly {
        0% { transform: translateY(0px) rotate(0deg); }
        100% { transform: translateY(-8px) rotate(5deg); }
      }
      
      @keyframes petSparkle {
        0% { box-shadow: 0 0 5px rgba(233, 30, 99, 0.5); }
        50% { box-shadow: 0 0 15px rgba(233, 30, 99, 0.8), 0 0 25px rgba(233, 30, 99, 0.4); }
        100% { box-shadow: 0 0 5px rgba(233, 30, 99, 0.5); }
      }
      
      @keyframes petDespawn {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.3) rotate(180deg); }
      }
      
      @keyframes vehicleDespawn {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.1); }
      }
      
      @keyframes floatDamage {
        0% { opacity: 1; transform: translateY(0px); }
        100% { opacity: 0; transform: translateY(-50px); }
      }
    `;
    document.head.appendChild(style);
  }

  // === INITIALIZATION ===
  function init() {
    console.log("🎮 A1K Enhanced Pets & Vehicles System Loading...");

    // Initialize systems
    G.pets = [];
    G.vehicles = [];
    G.party = G.party || [G.player].filter(Boolean);

    // Create UI
    createPetControls();
    createEquipmentUI();

    // Inject styles
    injectStyles();

    // Start update loop
    if (!G.updateLoop) {
      G.updateLoop = setInterval(() => gameUpdate(), 16); // 60fps
    }

    console.log("✅ A1K Enhanced Pets & Vehicles System Ready!");
    console.log("🐾 Pet Controls: Click PET button or triple-tap to recall");
    console.log(
      "🚗 Vehicle Controls: Short tap = cycle type, Long press = board/unboard"
    );
    console.log(
      "⚔️ Equipment: Click EQUIP button to open character equipment panel"
    );

    return {
      Pet,
      Vehicle,
      spawnPet,
      recallAllPets,
      cycleVehicleType,
      toggleVehicleBoarding,
      config: CONFIG,
    };
  }

  // Auto-initialize when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 100);
  }

  // Global API
  window.A1K_Enhanced = init();
})();
