/**
 * A1 Runner - Advanced Sprite Loader System
 * Dynamically loads and manages all game assets with caching and error handling
 */

class SpriteLoader {
  constructor() {
    this.assets = new Map();
    this.loadPromises = new Map();
    this.loadedCategories = new Set();
    this.errorHandler = this.defaultErrorHandler;
    this.loadingCallbacks = new Map();

    // Asset categories and their paths
    this.assetCategories = {
      characters: {
        path: "assets/characters/",
        extensions: ["png", "gif"],
        sprites: [
          "A1",
          "Missy",
          "Unique",
          "A1_sheet",
          "Missy_sheet",
          "Unique_sheet",
        ],
      },
      enemies: {
        path: "assets/enemies/",
        extensions: ["png", "gif"],
        sprites: [
          "boss_1",
          "boss_2_sheet",
          "boss_3_sheet",
          "miniboss_sheet",
          "mob_basic",
          "mobs_sheet_2",
        ],
      },
      effects: {
        path: "assets/effects/",
        extensions: ["png", "gif"],
        sprites: [
          "a1_attack",
          "slash_effect_red",
          "slash_effect_blue",
          "slash_effect_green",
          "slash_effect_purple",
          "sword_trail_red",
          "sword_trail_blue",
          "sword_trail_gold",
          "twin_eclipse",
          "ultimate_attack_trail",
          "explosion_small",
          "explosion_unique",
          "crit_flash",
          "ki_aura_gold",
          "rage_aura_sheet",
          "shadow_aura_test",
        ],
      },
      ui: {
        path: "assets/ui/",
        extensions: ["png"],
        sprites: [
          "slot_square",
          "slot_frame",
          "slot_highlight",
          "ui_button_primary",
          "ui_button_secondary",
          "panel_frame_9slice",
          "icons_sheet_32x32",
          "inventory_panel",
          "item_slot_common",
          "item_slot_rare",
          "item_slot_epic",
          "item_slot_legendary",
        ],
      },
      backgrounds: {
        path: "assets/backgrounds/",
        extensions: ["png", "gif"],
        sprites: [
          "bg",
          "BG_ground",
          "BG_mid",
          "parallax_1",
          "parallax_2",
          "parallax_3",
        ],
      },
      items: {
        path: "assets/items/",
        extensions: ["png"],
        sprites: [
          "weapon",
          "armor",
          "potion",
          "scroll",
          "key",
          "dagger_common",
          "dagger_rare",
          "dagger_epic",
          "dagger_legendary",
        ],
      },
      projectiles: {
        path: "assets/projectiles/",
        extensions: ["png"],
        sprites: ["bullet_player", "bullet_enemy", "beam_segment"],
      },
    };

    this.manifestCache = new Map();
    this.initializeLoader();
  }

  /**
   * Initialize the loader with default settings
   */
  initializeLoader() {
    console.log("A1 Runner Sprite Loader initialized");
    this.loadManifests();
  }

  /**
   * Load asset manifests if available
   */
  async loadManifests() {
    try {
      const manifestResponse = await fetch("data/asset_manifest.json");
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        this.processManifest(manifest);
      }
      // Also try enhanced complete manifest
      try {
        const complete = await fetch("assets/complete_manifest.json", {
          cache: "no-store",
        });
        if (complete.ok) {
          const cm = await complete.json();
          this.manifestCache.set("complete", cm);
          // If pets/vehicles listed, register categories for convenience
          if (cm.assets) {
            if (cm.assets.pets) {
              this.assetCategories.pets = this.assetCategories.pets || {
                path: "assets/pets/",
                extensions: ["png", "gif"],
                sprites: [],
              };
              this.assetCategories.pets.sprites = Array.from(
                new Set([
                  ...this.assetCategories.pets.sprites,
                  ...Object.values(cm.assets.pets)
                    .map((a) =>
                      (a.file || "")
                        .split("/")
                        .pop()
                        ?.replace(/\.(png|gif)$/i, "")
                    )
                    .filter(Boolean),
                ])
              );
            }
            if (cm.assets.vehicles) {
              this.assetCategories.vehicles = this.assetCategories.vehicles || {
                path: "assets/vehicles/",
                extensions: ["png", "gif"],
                sprites: [],
              };
              this.assetCategories.vehicles.sprites = Array.from(
                new Set([
                  ...this.assetCategories.vehicles.sprites,
                  ...Object.values(cm.assets.vehicles)
                    .map((a) =>
                      (a.file || "")
                        .split("/")
                        .pop()
                        ?.replace(/\.(png|gif)$/i, "")
                    )
                    .filter(Boolean),
                ])
              );
            }
          }
        }
      } catch {}
    } catch (error) {
      console.warn("No asset manifest found, using default configuration");
    }
  }

  /**
   * Process loaded manifest data
   */
  processManifest(manifest) {
    if (manifest.categories) {
      // Merge manifest categories with default categories
      Object.keys(manifest.categories).forEach((category) => {
        if (this.assetCategories[category]) {
          this.assetCategories[category] = {
            ...this.assetCategories[category],
            ...manifest.categories[category],
          };
        } else {
          this.assetCategories[category] = manifest.categories[category];
        }
      });
    }
    this.manifestCache.set("main", manifest);
    console.log("Asset manifest processed successfully");
  }

  /**
   * Load a single asset
   */
  async loadAsset(name, path, onProgress = null) {
    // Check if already loaded
    if (this.assets.has(name)) {
      return this.assets.get(name);
    }

    // Check if currently loading
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.assets.set(name, img);
        this.loadPromises.delete(name);
        if (onProgress) onProgress(name, true);
        resolve(img);
      };

      img.onerror = (error) => {
        this.loadPromises.delete(name);
        if (onProgress) onProgress(name, false, error);
        this.errorHandler(name, path, error);
        reject(error);
      };

      img.src = path;
    });

    this.loadPromises.set(name, loadPromise);
    return loadPromise;
  }

  /**
   * Load all assets in a category
   */
  async loadCategory(categoryName, onProgress = null) {
    if (this.loadedCategories.has(categoryName)) {
      return this.getCategoryAssets(categoryName);
    }

    const category = this.assetCategories[categoryName];
    if (!category) {
      throw new Error(`Unknown category: ${categoryName}`);
    }

    const loadPromises = [];
    const totalAssets = category.sprites.length * category.extensions.length;
    let loadedCount = 0;

    for (const sprite of category.sprites) {
      for (const ext of category.extensions) {
        const assetName = `${categoryName}_${sprite}`;
        const assetPath = `${category.path}${sprite}.${ext}`;

        const progressCallback = (name, success, error) => {
          loadedCount++;
          if (onProgress) {
            onProgress({
              category: categoryName,
              asset: name,
              loaded: loadedCount,
              total: totalAssets,
              progress: (loadedCount / totalAssets) * 100,
              success: success,
              error: error,
            });
          }
        };

        // Try to load the asset, but don't fail the entire category if one fails
        const loadPromise = this.loadAsset(
          assetName,
          assetPath,
          progressCallback
        ).catch((error) => {
          console.warn(`Failed to load ${assetName}: ${error.message}`);
          return null; // Return null instead of failing
        });

        loadPromises.push(loadPromise);
      }
    }

    const results = await Promise.allSettled(loadPromises);
    this.loadedCategories.add(categoryName);

    // Filter out null results (failed loads)
    const successfulAssets = results
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    console.log(
      `Loaded ${successfulAssets.length} assets in category: ${categoryName}`
    );
    return successfulAssets;
  }

  /**
   * Load all game assets
   */
  async loadAll(onProgress = null) {
    const categoryNames = Object.keys(this.assetCategories);
    const totalCategories = categoryNames.length;
    let completedCategories = 0;

    const categoryPromises = categoryNames.map(async (categoryName) => {
      const categoryProgress = (progressData) => {
        if (onProgress) {
          onProgress({
            ...progressData,
            categoryIndex: completedCategories,
            totalCategories: totalCategories,
            overallProgress:
              ((completedCategories + progressData.progress / 100) /
                totalCategories) *
              100,
          });
        }
      };

      try {
        const assets = await this.loadCategory(categoryName, categoryProgress);
        completedCategories++;
        return { category: categoryName, assets, success: true };
      } catch (error) {
        completedCategories++;
        console.error(`Failed to load category ${categoryName}:`, error);
        return { category: categoryName, assets: [], success: false, error };
      }
    });

    const results = await Promise.allSettled(categoryPromises);

    const summary = {
      totalCategories: totalCategories,
      successfulCategories: results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length,
      totalAssets: this.assets.size,
      loadedAt: new Date().toISOString(),
    };

    console.log("Asset loading complete:", summary);

    if (onProgress) {
      onProgress({
        category: "complete",
        overallProgress: 100,
        summary: summary,
      });
    }

    return summary;
  }

  /**
   * Get a specific asset
   */
  getAsset(name) {
    return this.assets.get(name) || null;
  }

  /**
   * Get all assets in a category
   */
  getCategoryAssets(categoryName) {
    const assets = {};
    const prefix = `${categoryName}_`;

    for (const [key, value] of this.assets.entries()) {
      if (key.startsWith(prefix)) {
        const assetName = key.substring(prefix.length);
        assets[assetName] = value;
      }
    }

    return assets;
  }

  /**
   * Check if an asset is loaded
   */
  isLoaded(name) {
    return this.assets.has(name);
  }

  /**
   * Check if a category is loaded
   */
  isCategoryLoaded(categoryName) {
    return this.loadedCategories.has(categoryName);
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      totalAssets: this.assets.size,
      loadedCategories: Array.from(this.loadedCategories),
      availableCategories: Object.keys(this.assetCategories),
      currentlyLoading: this.loadPromises.size,
    };
  }

  /**
   * Clear all loaded assets
   */
  clear() {
    this.assets.clear();
    this.loadPromises.clear();
    this.loadedCategories.clear();
    console.log("All assets cleared from cache");
  }

  /**
   * Default error handler
   */
  defaultErrorHandler(name, path, error) {
    console.warn(`Failed to load asset: ${name} from ${path}`, error);
  }

  /**
   * Set custom error handler
   */
  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  /**
   * Preload essential assets for immediate gameplay
   */
  async preloadEssentials(onProgress = null) {
    const essentialAssets = [
      { name: "characters_A1", path: "assets/characters/A1.png" },
      { name: "ui_slot_square", path: "assets/ui/slot_square.png" },
      { name: "backgrounds_bg", path: "assets/backgrounds/bg.png" },
      {
        name: "effects_slash_red",
        path: "assets/effects/slash_effect_red.png",
      },
    ];

    const loadPromises = essentialAssets.map(async (asset, index) => {
      const progressCallback = (name, success) => {
        if (onProgress) {
          onProgress({
            asset: name,
            loaded: index + 1,
            total: essentialAssets.length,
            progress: ((index + 1) / essentialAssets.length) * 100,
            success: success,
          });
        }
      };

      try {
        return await this.loadAsset(asset.name, asset.path, progressCallback);
      } catch (error) {
        console.warn(`Failed to preload essential asset: ${asset.name}`);
        return null;
      }
    });

    const results = await Promise.allSettled(loadPromises);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value !== null
    ).length;

    console.log(
      `Preloaded ${successful}/${essentialAssets.length} essential assets`
    );
    return successful;
  }

  /**
   * Generate a comprehensive asset report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      categories: {},
      manifest: Array.from(this.manifestCache.entries()),
    };

    Object.keys(this.assetCategories).forEach((category) => {
      report.categories[category] = {
        configured: this.assetCategories[category],
        loaded: this.isCategoryLoaded(category),
        assets: Object.keys(this.getCategoryAssets(category)),
      };
    });

    return report;
  }
}

// Global sprite loader instance
window.spriteLoader = new SpriteLoader();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = SpriteLoader;
}
