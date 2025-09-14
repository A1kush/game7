// A1 Effects Sprite Loader
// Responsible for loading and managing A1's sword effects sprites

class A1EffectsSpriteLoader {
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl || "."; // Use current directory as base if not specified
    this.sprites = {};
    this.animations = {};
    this.loadingPromises = [];
    this.loaded = false;
    console.log(
      "A1 Effects Sprite Loader initialized with baseUrl:",
      this.baseUrl
    );
  }

  // Main initialization method
  async initialize() {
    console.log("Initializing A1 Effects Sprite Loader...");

    // Register the effect categories
    this.registerEffectCategories([
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
    ]);

    try {
      // Start loading all effects
      await this.loadAllEffects();

      this.loaded = true;
      console.log("A1 Effects Sprite Loader: All effects loaded successfully!");
    } catch (error) {
      console.error("Error loading effects:", error);
      // Mark as loaded anyway to allow fallbacks to work
      this.loaded = true;
      console.warn(
        "A1 Effects Sprite Loader: Some effects failed to load, but continuing with what we have"
      );
    }

    return this;
  }

  // Register effect categories
  registerEffectCategories(categories) {
    categories.forEach((category) => {
      this.sprites[category] = [];
      this.animations[category] = null;
    });
  }

  // Preload all effects
  async loadAllEffects() {
    // Clear previous loading promises
    this.loadingPromises = [];

    // Sword trails
    ["blue", "purple", "red", "gold"].forEach((color) => {
      this.loadingPromises.push(this.loadEffect(`sword_trail_${color}`, 8));
    });

    // Slash effects
    ["blue", "purple", "red", "gold"].forEach((color) => {
      this.loadingPromises.push(this.loadEffect(`slash_effect_${color}`, 8));
    });

    // Dark aura
    this.loadingPromises.push(this.loadEffect("dark_aura", 12));

    // Twin Eclipse
    this.loadingPromises.push(this.loadEffect("twin_eclipse", 10));

    // Wait for all to complete
    return Promise.all(this.loadingPromises);
  }

  // Load a specific effect
  async loadEffect(effectName, frameCount) {
    console.log(`Loading ${effectName} effect (${frameCount} frames)...`);

    // Create array for this effect's frames
    this.sprites[effectName] = [];

    // Load individual frames
    for (let i = 0; i < frameCount; i++) {
      const frameIndex = i.toString().padStart(2, "0");
      const path = `${this.baseUrl}/generated_a1_effects/${effectName}_${frameIndex}.png`;

      try {
        const image = await this.loadImage(path);
        this.sprites[effectName].push(image);
      } catch (error) {
        console.error(`Failed to load ${path}:`, error);
        // Add a placeholder to maintain frame order
        this.sprites[effectName].push(null);
      }
    }

    // Also load the GIF version for convenience
    try {
      const gifPath = `${this.baseUrl}/generated_a1_effects/${effectName}.gif`;
      const gifImage = await this.loadImage(gifPath);
      this.animations[effectName] = gifImage;
    } catch (error) {
      console.error(`Failed to load ${effectName}.gif:`, error);
    }

    return this.sprites[effectName];
  }

  // Helper method to load a single image
  loadImage(src) {
    console.log(`Loading image from: ${src}`);
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        console.log(
          `Successfully loaded image: ${src} (${img.width}x${img.height})`
        );
        resolve(img);
      };

      img.onerror = (e) => {
        console.error(`Failed to load image: ${src}`, e);
        // Create a fallback colored image for testing
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 100;
        tempCanvas.height = 100;
        const ctx = tempCanvas.getContext("2d");
        ctx.fillStyle = "rgba(255,0,255,0.5)";
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Missing", 50, 45);
        ctx.fillText("Image", 50, 65);

        const tempImg = new Image();
        tempImg.src = tempCanvas.toDataURL();
        tempImg.onload = () => resolve(tempImg);

        // Also reject to track failures
        reject(new Error(`Failed to load image: ${src}`));
      };

      // Start loading the image
      img.src = src;

      // After 3 seconds, log a warning if the image still hasn't loaded
      setTimeout(() => {
        if (!img.complete) {
          console.warn(`Image taking too long to load: ${src}`);
        }
      }, 3000);
    });
  }

  // Get a specific effect's frames
  getEffectFrames(effectName) {
    if (!this.sprites[effectName]) {
      console.error(`Effect "${effectName}" not found`);
      return [];
    }
    return this.sprites[effectName];
  }

  // Get a specific effect's animation (GIF)
  getEffectAnimation(effectName) {
    return this.animations[effectName];
  }

  // Display an effect in a container element
  displayEffect(effectName, container, x, y, options = {}) {
    if (!this.loaded) {
      console.error("A1 Effects Sprite Loader not fully loaded yet");
      return null;
    }

    const frames = this.getEffectFrames(effectName);
    if (!frames.length) {
      console.error(`No frames loaded for effect: ${effectName}`);
      return null;
    }

    // Default options
    const {
      scale = 1.0,
      duration = 800, // ms for full animation
      loop = false,
      autoRemove = true,
      onComplete = null,
      zIndex = 10,
    } = options;

    // Create container for the effect
    const effectElement = document.createElement("div");
    effectElement.className = "a1-effect-display";
    effectElement.style.position = "absolute";
    effectElement.style.left = `${x}px`;
    effectElement.style.top = `${y}px`;
    effectElement.style.zIndex = zIndex;
    effectElement.style.transform = `scale(${scale})`;
    effectElement.style.transformOrigin = "center center";
    effectElement.style.pointerEvents = "none";
    effectElement.style.filter = "drop-shadow(0 0 8px rgba(255,255,255,0.7))";

    // Make sure the effect stands out
    console.log(
      `Creating effect element at (${x},${y}) with z-index ${zIndex}`
    );

    // Add to container
    container.appendChild(effectElement);

    // Prepare for animation
    let currentFrame = 0;
    const frameCount = frames.length;
    const frameDelay = duration / frameCount;

    // Create image element for the effect
    const imgElement = document.createElement("img");
    imgElement.style.position = "absolute";
    imgElement.style.transform = "translate(-50%, -50%)"; // Center the effect
    imgElement.style.imageRendering = "pixelated"; // Better for pixel art
    imgElement.style.width = "auto"; // Maintain aspect ratio
    imgElement.style.height = "auto"; // Maintain aspect ratio
    imgElement.style.maxWidth = "none"; // Override any container restrictions
    imgElement.style.maxHeight = "none"; // Override any container restrictions
    effectElement.appendChild(imgElement);

    // Animation function
    const animate = () => {
      if (currentFrame >= frameCount) {
        if (loop) {
          currentFrame = 0;
        } else {
          if (autoRemove) {
            console.log(`Animation complete, removing effect element`);
            effectElement.remove();
          }
          if (onComplete) {
            onComplete();
          }
          return;
        }
      }

      // Set current frame
      if (frames[currentFrame]) {
        imgElement.src = frames[currentFrame].src;
        // Make sure the image is visible
        imgElement.style.opacity = "1";
        imgElement.style.visibility = "visible";
        imgElement.style.display = "block";
        console.log(
          `Setting frame ${currentFrame}/${frameCount} for ${effectName}`
        );
      } else {
        console.warn(`Missing frame ${currentFrame} for effect ${effectName}`);
      }

      // Advance to next frame
      currentFrame++;

      // Schedule next frame
      setTimeout(animate, frameDelay);
    };

    // Start animation
    animate();

    return effectElement;
  }

  // Play effect at specific coordinates
  playEffect(effectName, container, x, y, options = {}) {
    return this.displayEffect(effectName, container, x, y, options);
  }
}

// Create global instance for use in game
window.A1EffectsLoader = new A1EffectsSpriteLoader();

// Preload effects when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing A1 effects loader...");
  window.A1EffectsLoader.initialize()
    .then(() => {
      console.log("A1 effects preloaded successfully!");
      // Dispatch custom event that game can listen for
      document.dispatchEvent(new CustomEvent("a1effects-loaded"));
    })
    .catch((err) => {
      console.error("Error preloading A1 effects:", err);
    });
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { A1EffectsSpriteLoader };
}
