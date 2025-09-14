// A1 Effects Core System
// This is a completely revamped version of the effects loader with more robust fallbacks and handling

class A1EffectsCore {
  constructor() {
    this.initialized = false;
    this.effectsPath = "./generated_a1_effects"; // Default path
    this.effects = {}; // Storage for loaded effects
    this.effectElements = []; // Track effect elements on screen
    this.maxElementsOnScreen = 20; // Prevent too many elements
    this.retryCount = 0;
    this.maxRetries = 3;

    // Register event listener for DOM load
    document.addEventListener("DOMContentLoaded", () => this.initialize());
  }

  // Get the game container
  getGameContainer() {
    return document.querySelector(".game-container") || document.body;
  }

  // Initialize the effects system
  async initialize(basePath = null) {
    if (basePath) this.effectsPath = basePath;
    console.log(`[A1Effects] Initializing with path: ${this.effectsPath}`);

    try {
      // Define all effect types we'll use
      const effectTypes = [
        "sword_trail_blue",
        "sword_trail_purple",
        "sword_trail_red",
        "sword_trail_gold",
        "slash_effect_blue",
        "slash_effect_purple",
        "slash_effect_red",
        "slash_effect_gold",
        "dark_aura",
        "twin_eclipse",
      ];

      // Reset effects storage
      this.effects = {};

      // Load all effect types in parallel
      const loadPromises = effectTypes.map((type) => this.loadEffectType(type));
      await Promise.allSettled(loadPromises);

      // Check if we have at least some effects loaded
      const loadedCount = Object.keys(this.effects).filter(
        (key) =>
          this.effects[key] &&
          this.effects[key].frames &&
          this.effects[key].frames.length > 0
      ).length;

      if (loadedCount > 0) {
        console.log(
          `[A1Effects] Successfully loaded ${loadedCount}/${effectTypes.length} effect types`
        );
        this.initialized = true;

        // Dispatch event
        document.dispatchEvent(new CustomEvent("a1effects-ready"));
        return true;
      } else {
        console.error("[A1Effects] Failed to load any effects");
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(
            `[A1Effects] Retrying (${this.retryCount}/${this.maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return this.initialize();
        }
        return false;
      }
    } catch (error) {
      console.error("[A1Effects] Initialization error:", error);
      return false;
    }
  }

  // Load a specific effect type (like 'sword_trail_blue')
  async loadEffectType(effectType) {
    console.log(`[A1Effects] Loading effect: ${effectType}`);

    try {
      // Initialize effect object
      this.effects[effectType] = {
        frames: [],
        gif: null,
        frameCount: effectType.includes("twin_eclipse")
          ? 10
          : effectType.includes("dark_aura")
          ? 12
          : 8,
      };

      // Use fetch API to detect if files exist
      const frames = [];

      // Load frames using image objects for more reliable loading
      for (let i = 0; i < this.effects[effectType].frameCount; i++) {
        const frameIndex = i.toString().padStart(2, "0");
        const framePath = `${this.effectsPath}/${effectType}_${frameIndex}.png`;

        try {
          const img = await this.loadImage(framePath);
          frames.push(img);
        } catch (error) {
          console.warn(
            `[A1Effects] Failed to load frame ${i} for ${effectType}:`,
            error
          );
        }
      }

      // Load the GIF version too
      try {
        const gifPath = `${this.effectsPath}/${effectType}.gif`;
        const gifImg = await this.loadImage(gifPath);
        this.effects[effectType].gif = gifImg;
      } catch (error) {
        console.warn(
          `[A1Effects] Failed to load GIF for ${effectType}:`,
          error
        );
      }

      // Store frames
      this.effects[effectType].frames = frames;

      return frames.length > 0;
    } catch (error) {
      console.error(`[A1Effects] Error loading ${effectType}:`, error);
      return false;
    }
  }

  // Helper to load an image with timeout and proper error handling
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      // Set up timeout
      const timeout = setTimeout(() => {
        console.warn(`[A1Effects] Image load timeout: ${src}`);
        reject(new Error("Image load timeout"));
      }, 5000);

      // Success handler
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      // Error handler
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load image: ${src}`));
      };

      // Start loading
      img.src = src;
    });
  }

  // Play an effect at a specific position
  playEffect(effectType, x, y, options = {}) {
    // Don't attempt if not initialized
    if (!this.initialized) {
      console.warn("[A1Effects] Cannot play effect - system not initialized");
      return null;
    }

    // Check if effect exists
    if (!this.effects[effectType] || !this.effects[effectType].frames.length) {
      console.warn(
        `[A1Effects] Effect not found or has no frames: ${effectType}`
      );
      return null;
    }

    console.log(`[A1Effects] Playing effect ${effectType} at (${x}, ${y})`);

    // Limit number of effects on screen
    if (this.effectElements.length >= this.maxElementsOnScreen) {
      console.warn("[A1Effects] Too many effects on screen, removing oldest");
      const oldest = this.effectElements.shift();
      if (oldest && oldest.parentNode) {
        oldest.parentNode.removeChild(oldest);
      }
    }

    // Default options
    const {
      container = this.getGameContainer(),
      scale = 1.0,
      duration = 800,
      loop = false,
      autoRemove = true,
      zIndex = 100,
      rotation = 0,
      opacity = 1,
      onComplete = null,
    } = options;

    // Create container element
    const effectElement = document.createElement("div");
    effectElement.className = "a1-effect-container";
    effectElement.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      z-index: ${zIndex};
      transform: translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg);
      opacity: ${opacity};
      pointer-events: none;
      will-change: transform, opacity;
    `;

    // Create the actual image element
    const imgElement = document.createElement("img");
    imgElement.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      display: block;
      max-width: none;
      max-height: none;
      image-rendering: pixelated;
      transform-origin: center center;
    `;
    effectElement.appendChild(imgElement);

    // Add to container
    container.appendChild(effectElement);

    // Track this element
    this.effectElements.push(effectElement);

    // Animation variables
    const frames = this.effects[effectType].frames;
    const frameCount = frames.length;
    const frameDuration = duration / frameCount;
    let currentFrame = 0;

    // Animation function
    const animate = () => {
      if (currentFrame >= frameCount) {
        if (loop) {
          currentFrame = 0;
        } else {
          // Animation complete
          if (autoRemove) {
            // Add a small delay before removal for smoother experience
            setTimeout(() => {
              if (effectElement.parentNode) {
                effectElement.parentNode.removeChild(effectElement);
              }
              // Remove from our tracking array
              const idx = this.effectElements.indexOf(effectElement);
              if (idx !== -1) this.effectElements.splice(idx, 1);
            }, 50);
          }

          // Call completion callback if provided
          if (onComplete && typeof onComplete === "function") {
            onComplete();
          }

          return;
        }
      }

      // Set current frame
      if (frames[currentFrame]) {
        imgElement.src = frames[currentFrame].src;
      }

      // Advance to next frame
      currentFrame++;

      // Schedule next frame
      if (currentFrame < frameCount || loop) {
        setTimeout(animate, frameDuration);
      }
    };

    // Start animation
    animate();

    // Return the element for potential manipulation
    return effectElement;
  }

  // Clean up all active effects
  clearEffects() {
    this.effectElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    this.effectElements = [];
  }

  // Check if an effect type is available
  hasEffect(effectType) {
    return !!(
      this.effects[effectType] && this.effects[effectType].frames.length > 0
    );
  }

  // Get available effect types
  getAvailableEffects() {
    return Object.keys(this.effects).filter(
      (key) => this.effects[key] && this.effects[key].frames.length > 0
    );
  }
}

// Create global instance
window.A1Effects = new A1EffectsCore();

// Auto-initialize when the script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[A1Effects] DOM ready, initializing...");
    window.A1Effects.initialize();
  });
} else {
  console.log("[A1Effects] DOM already ready, initializing...");
  window.A1Effects.initialize();
}
