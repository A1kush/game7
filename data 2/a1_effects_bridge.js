// A1 Effects Bridge
// This script bridges the A1 effects system with the sword system

class A1EffectsBridge {
  constructor() {
    // Reference to the core effects system
    this.core = window.A1Effects;

    // Reference to the sword system
    this.swordSystem = null;

    // Fallback settings
    this.fallbackEffects = {
      sword_trail_blue: { color: "#0080ff", size: 80, duration: 600 },
      sword_trail_red: { color: "#ff2020", size: 80, duration: 600 },
      sword_trail_purple: { color: "#8040ff", size: 80, duration: 600 },
      sword_trail_gold: { color: "#ffcc20", size: 80, duration: 600 },
      slash_effect_blue: { color: "#40a0ff", size: 120, duration: 800 },
      slash_effect_red: { color: "#ff4040", size: 120, duration: 800 },
      slash_effect_purple: { color: "#a040ff", size: 120, duration: 800 },
      slash_effect_gold: { color: "#ffd040", size: 120, duration: 800 },
      dark_aura: { color: "#400080", size: 150, duration: 1200 },
      twin_eclipse: { color: "#ff8000", size: 180, duration: 1500 },
    };

    // Initialize if effects core is ready, otherwise wait for it
    if (this.core && this.core.initialized) {
      console.log("[A1EffectsBridge] Effects core already initialized");
    } else {
      document.addEventListener("a1effects-ready", () => {
        console.log("[A1EffectsBridge] Effects core is now ready");
      });
    }

    // Watch for the sword system to be initialized
    this.watchForSwordSystem();
  }

  // Watch for the sword system to be initialized
  watchForSwordSystem() {
    // Check if it already exists
    if (window.game && window.game.a1SwordEffects) {
      this.connectToSwordSystem(window.game.a1SwordEffects);
      return;
    }

    // Set up interval to check for the sword system
    const checkInterval = setInterval(() => {
      if (window.game && window.game.a1SwordEffects) {
        clearInterval(checkInterval);
        this.connectToSwordSystem(window.game.a1SwordEffects);
      }
    }, 1000);

    // Safety timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.warn(
        "[A1EffectsBridge] Could not find sword system after 10 seconds"
      );
    }, 10000);
  }

  // Connect to the sword system
  connectToSwordSystem(swordSystem) {
    if (!swordSystem) return;

    console.log("[A1EffectsBridge] Connecting to sword system");
    this.swordSystem = swordSystem;

    // Hook into the playEffect method of the sword system
    const originalPlayEffect = swordSystem.playEffect;
    swordSystem.playEffect = (effectName, x, y, options = {}) => {
      return this.playEffect(effectName, x, y, options);
    };

    console.log("[A1EffectsBridge] Successfully connected to sword system");
  }

  // Play an effect
  playEffect(effectName, x, y, options = {}) {
    console.log(
      `[A1EffectsBridge] Request to play effect: ${effectName} at (${x}, ${y})`
    );

    // Use A1Effects core if available and initialized
    if (this.core && this.core.initialized && this.core.hasEffect(effectName)) {
      console.log(`[A1EffectsBridge] Using A1Effects core for ${effectName}`);

      // Default options for different effect types
      const effectOptions = { ...options };

      // Customize options based on effect type
      if (effectName.includes("sword_trail")) {
        effectOptions.scale = effectOptions.scale || 0.8;
        effectOptions.duration = effectOptions.duration || 600;
      } else if (effectName.includes("slash_effect")) {
        effectOptions.scale = effectOptions.scale || 1.2;
        effectOptions.duration = effectOptions.duration || 800;
        effectOptions.zIndex = effectOptions.zIndex || 120;
      } else if (effectName.includes("dark_aura")) {
        effectOptions.scale = effectOptions.scale || 1.5;
        effectOptions.duration = effectOptions.duration || 1200;
        effectOptions.zIndex = effectOptions.zIndex || 110;
      } else if (effectName.includes("twin_eclipse")) {
        effectOptions.scale = effectOptions.scale || 1.2;
        effectOptions.duration = effectOptions.duration || 1500;
        effectOptions.zIndex = effectOptions.zIndex || 130;
      }

      return this.core.playEffect(effectName, x, y, effectOptions);
    }
    // If effects system isn't working, use fallback
    else {
      console.log(`[A1EffectsBridge] Using fallback for ${effectName}`);
      return this.playFallbackEffect(effectName, x, y, options);
    }
  }

  // Play a fallback effect when the main system fails
  playFallbackEffect(effectName, x, y, options = {}) {
    // Get container
    const container =
      options.container ||
      (this.swordSystem && this.swordSystem.gameContainer) ||
      document.querySelector(".game-container") ||
      document.body;

    // Get fallback settings
    const settings = this.fallbackEffects[effectName] || {
      color: "#ffffff",
      size: 100,
      duration: 800,
    };

    // Create fallback effect element
    const effect = document.createElement("div");
    effect.className = "a1-fallback-effect";
    effect.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${settings.size}px;
      height: ${settings.size}px;
      background: radial-gradient(circle, ${settings.color}aa 0%, ${
      settings.color
    }00 70%);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0.8;
      pointer-events: none;
      z-index: ${options.zIndex || 100};
      animation: a1FallbackEffect ${settings.duration}ms ease-out forwards;
    `;

    // Add to container
    container.appendChild(effect);

    // Create animation style if it doesn't exist
    if (!document.getElementById("a1-fallback-effect-style")) {
      const style = document.createElement("style");
      style.id = "a1-fallback-effect-style";
      style.textContent = `
        @keyframes a1FallbackEffect {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove after animation completes
    setTimeout(() => {
      if (effect.parentNode) {
        effect.parentNode.removeChild(effect);
      }
    }, settings.duration);

    return effect;
  }
}

// Create global instance
window.A1EffectsBridge = new A1EffectsBridge();

// Log initialization
console.log("[A1EffectsBridge] Initialized and waiting for effects system");
