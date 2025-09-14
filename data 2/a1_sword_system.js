// A1 Sword Effects Integration
// Integrates A1 character's sword effects into the game

// A1 Character Skills Configuration
const A1Config = {
  // Basic Properties
  name: "A1",
  baseAttackDamage: 120,
  baseAttackSpeed: 1.2,

  // Twin Eclipse Passive Properties
  twinEclipseUnlocked: true,
  twinEclipseCooldown: 8,
  twinEclipseDamageMultiplier: 2.0,

  // Rage System Properties
  maxRage: 100,
  rageGainPerHit: 10,
  rageDecay: 2,
  rageDamageBoost: 0.5,

  // Skill Properties
  skills: {
    s1: {
      name: "Slash Wave (S1)",
      damage: 200,
      cooldown: 5,
      range: 300,
      effectColor: "blue",
      description:
        "Send a wave of energy in front of you, dealing damage to all enemies in a line.",
    },
    s2: {
      name: "Dark Aura Strike (S2)",
      damage: 250,
      cooldown: 8,
      range: 200,
      effectColor: "purple",
      description:
        "Surround yourself with dark aura and strike nearby enemies.",
    },
    s3: {
      name: "Twin Eclipse Combo (S3)",
      damage: 350,
      cooldown: 12,
      range: 250,
      effectColor: "gold",
      description: "Execute a powerful combo attack that hits twice.",
    },
    s4: {
      name: "Void Slash (S4)",
      damage: 400,
      cooldown: 15,
      range: 350,
      effectColor: "red",
      description:
        "Create a tear in space that damages all enemies in its path.",
    },
    s5: {
      name: "Final Eclipse (S5)",
      damage: 600,
      cooldown: 30,
      range: 400,
      effectColor: "gold",
      description:
        "Ultimate attack that combines all sword techniques into one devastating blow.",
    },
  },
};

// Class for handling A1's sword effects
class A1SwordEffects {
  constructor(game) {
    this.game = game;
    this.effects = {};
    this.rageMeter = 0;
    this.twinEclipseTimer = 0;
    this.effectsLoaded = false;
    this.gameContainer =
      document.querySelector(".game-container") || document.body;
    console.log("Game container reference:", this.gameContainer);

    // Store a reference to the game globally for the bridge to find
    if (window.game === undefined) {
      window.game = {};
    }
    window.game.a1SwordEffects = this;

    // Select the appropriate effects system
    if (window.A1Effects && window.A1Effects.initialized) {
      console.log("Using A1Effects core system");
      this.loader = window.A1Effects;
    } else {
      console.log("Using legacy effects loader");
      this.loader = window.A1EffectsLoader;
    }

    // Load effect resources
    this.loadEffects();
  }

  async loadEffects() {
    console.log("Loading A1 sword effects...");

    // Set up effects object structure for reference
    ["blue", "purple", "red", "gold"].forEach((color) => {
      // Sword trails
      this.effects[`sword_trail_${color}`] = {
        gif: `generated_a1_effects/sword_trail_${color}.gif`,
        frames: [], // Will be populated by the effects system
      };

      // Slash effects
      this.effects[`slash_effect_${color}`] = {
        gif: `generated_a1_effects/slash_effect_${color}.gif`,
        frames: [], // Will be populated by the effects system
      };
    });

    // Load dark aura effect
    this.effects.dark_aura = {
      gif: "generated_a1_effects/dark_aura.gif",
      frames: [],
    };

    // Load Twin Eclipse effect
    this.effects.twin_eclipse = {
      gif: "generated_a1_effects/twin_eclipse.gif",
      frames: [],
    };

    // Use the new effects system if available, or fall back to the loader
    if (window.A1Effects && window.A1Effects.initialized) {
      console.log("Using new A1 Effects Core system");
      this.loader = window.A1Effects;
      this.effectsLoaded = true;
    } else if (window.A1EffectsLoader) {
      console.log("Falling back to original A1 Effects Loader");

      // Initialize the original effects loader if it's not already loaded
      if (!this.loader.loaded) {
        try {
          await this.loader.initialize();
          this.effectsLoaded = true;
          console.log("A1 sword effects loaded successfully");
        } catch (error) {
          console.error("Failed to load A1 sword effects:", error);
          this.effectsLoaded = false;
        }
      } else {
        this.effectsLoaded = true;
        console.log("A1 effects loader already initialized");
      }
    }

    console.log("A1 sword effects reference objects created");
  }

  // Handle A1's basic attack
  basicAttack(target) {
    console.log("A1 performing basic sword attack");

    // Calculate damage
    let damage = A1Config.baseAttackDamage;

    // Apply rage boost if available
    if (this.rageMeter > 0) {
      const rageBoost =
        Math.min(this.rageMeter / A1Config.maxRage, 1) *
        A1Config.rageDamageBoost;
      damage *= 1 + rageBoost;
      console.log(
        `Rage boosted damage: ${damage.toFixed(0)} (+${(
          rageBoost * 100
        ).toFixed(0)}%)`
      );

      // Decrease rage
      this.rageMeter = Math.max(0, this.rageMeter - A1Config.rageDecay);
    }

    // Check for Twin Eclipse passive
    if (A1Config.twinEclipseUnlocked && this.twinEclipseTimer <= 0) {
      console.log("Twin Eclipse passive activated!");

      // Play Twin Eclipse effect
      this.playEffect("twin_eclipse", target.x, target.y);

      // Deal double damage
      damage *= A1Config.twinEclipseDamageMultiplier;

      // Reset cooldown
      this.twinEclipseTimer = A1Config.twinEclipseCooldown;
    }

    // Play sword trail effect
    this.playEffect("sword_trail_blue", target.x, target.y);

    // Gain rage
    this.gainRage(A1Config.rageGainPerHit);

    return damage;
  }

  // Play specified effect at target location
  playEffect(effectName, x, y, options = {}) {
    const effect = this.effects[effectName];
    if (!effect) {
      console.error(`Effect ${effectName} not found`);
      return;
    }

    console.log(`Playing effect ${effectName} at (${x}, ${y})`);

    // Use the container from options, game container, or fall back to document.body
    const container = options.container || this.gameContainer || document.body;

    // Set default options based on effect type
    const effectOptions = {
      scale: 1.0,
      duration: 800,
      autoRemove: true,
      zIndex: 10,
      container,
      ...options,
    };

    // Adjust options based on effect type
    switch (effectName) {
      case "dark_aura":
        effectOptions.scale = 1.5;
        effectOptions.duration = 1000;
        effectOptions.zIndex = 5;
        break;
      case "twin_eclipse":
        effectOptions.scale = 1.2;
        effectOptions.duration = 1200;
        effectOptions.zIndex = 20;
        break;
      default:
        // For sword trails and slash effects
        if (effectName.startsWith("sword_trail_")) {
          effectOptions.scale = 0.8;
          effectOptions.duration = 600;
        } else if (effectName.startsWith("slash_effect_")) {
          effectOptions.scale = 1.2;
          effectOptions.duration = 800;
          effectOptions.zIndex = 15;
        }
    }

    // Check for effects bridge first
    if (window.A1EffectsBridge) {
      console.log("Using A1EffectsBridge for effects");
      return window.A1EffectsBridge.playEffect(effectName, x, y, effectOptions);
    }
    // Fall back to direct effects core if available
    else if (window.A1Effects && window.A1Effects.initialized) {
      console.log("Using A1Effects core for effects");
      return window.A1Effects.playEffect(effectName, x, y, effectOptions);
    }
    // Use the original loader as last resort
    else if (this.loader && this.effectsLoaded) {
      console.log("Using legacy effects loader");
      return this.loader.playEffect(effectName, container, x, y, effectOptions);
    } else {
      console.warn("No effects system available, can't display effect");
      return null;
    }
  }

  // Handle rage system
  gainRage(amount) {
    this.rageMeter = Math.min(A1Config.maxRage, this.rageMeter + amount);
    console.log(`Rage meter: ${this.rageMeter}/${A1Config.maxRage}`);

    // Update UI
    this.updateRageUI();
  }

  updateRageUI() {
    // Update the rage meter UI element
    const ragePercentage = (this.rageMeter / A1Config.maxRage) * 100;
    console.log(`Updating rage UI: ${ragePercentage.toFixed(0)}%`);

    // In a real implementation, this would update the UI
  }

  // Handle A1's skills
  useSkill(skillId, target) {
    const skill = A1Config.skills[skillId];
    if (!skill) {
      console.error(`Skill ${skillId} not found`);
      return 0;
    }

    console.log(`Using skill: ${skill.name}`);

    // Play appropriate effect based on the skill
    switch (skillId) {
      case "s1":
        // Slash Wave (S1) implementation
        this.playEffect(
          `slash_effect_${skill.effectColor}`,
          target.x,
          target.y
        );
        break;

      case "s2":
        // Dark Aura Strike (S2) implementation
        this.playEffect("dark_aura", this.game.player.x, this.game.player.y);
        this.playEffect(`sword_trail_${skill.effectColor}`, target.x, target.y);
        break;

      case "s3":
        // Twin Eclipse Combo (S3) implementation
        this.playEffect("twin_eclipse", target.x, target.y);
        this.playEffect(
          `slash_effect_${skill.effectColor}`,
          target.x,
          target.y
        );
        break;

      case "s4":
        // Void Slash (S4) implementation
        this.playEffect(
          `slash_effect_${skill.effectColor}`,
          target.x,
          target.y
        );
        // Add void tear effect (special effect for S4)
        console.log("Creating void tear in space");
        break;

      case "s5":
        // Final Eclipse (S5) implementation
        this.playEffect("dark_aura", this.game.player.x, this.game.player.y);
        this.playEffect("twin_eclipse", target.x, target.y);
        this.playEffect(
          `slash_effect_${skill.effectColor}`,
          target.x,
          target.y
        );
        break;
    }

    // Gain rage from skill use
    this.gainRage(A1Config.rageGainPerHit * 2);

    return skill.damage;
  }

  // Update method called on each game loop
  update(delta) {
    // Update cooldowns
    if (this.twinEclipseTimer > 0) {
      this.twinEclipseTimer -= delta;
    }

    // Update rage decay over time
    if (this.rageMeter > 0) {
      this.rageMeter = Math.max(
        0,
        this.rageMeter - A1Config.rageDecay * 0.1 * delta
      );

      // Only update UI if there's a significant change
      if (Math.floor(this.rageMeter) % 5 === 0) {
        this.updateRageUI();
      }
    }
  }
}

// Game integration helpers
function initA1SwordSystem(game) {
  console.log("Initializing A1 Sword System");
  game.a1SwordEffects = new A1SwordEffects(game);

  // Hook into existing melee system
  const originalMelee = game.melee || function () {};

  game.melee = function (target) {
    // If player character is A1, use the A1 sword system
    if (game.player && game.player.character === "A1") {
      return game.a1SwordEffects.basicAttack(target);
    }

    // Otherwise use original melee function
    return originalMelee.call(game, target);
  };

  // Hook into existing skill system
  const originalUseSkill = game.useSkill || function () {};

  game.useSkill = function (skillId, target) {
    // If player character is A1, use the A1 skill system
    if (
      game.player &&
      game.player.character === "A1" &&
      skillId.startsWith("s") &&
      A1Config.skills[skillId]
    ) {
      return game.a1SwordEffects.useSkill(skillId, target);
    }

    // Otherwise use original useSkill function
    return originalUseSkill.call(game, skillId, target);
  };

  // Initialize UI
  initA1UI(game);

  return game.a1SwordEffects;
}

// Initialize A1-specific UI elements
function initA1UI(game) {
  console.log("Initializing A1 UI elements");

  // Add rage meter
  const rageMeter = document.createElement("div");
  rageMeter.id = "rage-meter";
  rageMeter.className = "meter";
  rageMeter.innerHTML = `
        <div class="meter-label">RAGE</div>
        <div class="meter-bar">
            <div class="meter-fill" style="width: 0%"></div>
        </div>
    `;

  // Add S4 and S5 skill buttons
  const skillContainer =
    document.querySelector(".skill-container") || document.body;

  // S4 Button
  const s4Button = document.createElement("div");
  s4Button.id = "s4-button";
  s4Button.className = "skill-button";
  s4Button.innerHTML = `
        <div class="skill-icon">S4</div>
        <div class="cooldown-overlay"></div>
    `;

  // S5 Button
  const s5Button = document.createElement("div");
  s5Button.id = "s5-button";
  s5Button.className = "skill-button";
  s5Button.innerHTML = `
        <div class="skill-icon">S5</div>
        <div class="cooldown-overlay"></div>
    `;

  // Add buttons to container
  if (skillContainer !== document.body) {
    skillContainer.appendChild(s4Button);
    skillContainer.appendChild(s5Button);
    document.body.appendChild(rageMeter);
  }

  // Add event listeners
  s4Button.addEventListener("click", function () {
    game.useSkill("s4", game.getTargetPosition());
    startCooldown("s4");
  });

  s5Button.addEventListener("click", function () {
    game.useSkill("s5", game.getTargetPosition());
    startCooldown("s5");
  });

  // Cooldown function
  function startCooldown(skillId) {
    const button = document.getElementById(`${skillId}-button`);
    const cooldownOverlay = button.querySelector(".cooldown-overlay");
    const skill = A1Config.skills[skillId];

    button.classList.add("on-cooldown");
    cooldownOverlay.style.animation = `cooldown ${skill.cooldown}s linear 1`;

    setTimeout(() => {
      button.classList.remove("on-cooldown");
      cooldownOverlay.style.animation = "";
    }, skill.cooldown * 1000);
  }
}

// Export functions for use in game
window.A1SwordSystem = {
  init: initA1SwordSystem,
  config: A1Config,
};
