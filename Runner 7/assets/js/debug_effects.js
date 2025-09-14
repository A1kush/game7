// Debug file to help trace why effects aren't showing
console.log("Debug script loaded");

// Hook into the A1EffectsLoader global object
const originalPlayEffect = window.A1EffectsLoader?.playEffect;
if (originalPlayEffect) {
  window.A1EffectsLoader.playEffect = function (
    effectName,
    container,
    x,
    y,
    options = {}
  ) {
    console.log(`PLAYING EFFECT: ${effectName} at (${x}, ${y})`, options);
    console.log(`Container:`, container);
    const result = originalPlayEffect.call(
      this,
      effectName,
      container,
      x,
      y,
      options
    );
    console.log(`Effect element created:`, result);
    return result;
  };
}

// Hook into the A1SwordEffects playEffect method
document.addEventListener("DOMContentLoaded", () => {
  // Wait for game to initialize
  setTimeout(() => {
    if (window.game && window.game.a1SwordEffects) {
      const originalPlayEffect = window.game.a1SwordEffects.playEffect;
      window.game.a1SwordEffects.playEffect = function (
        effectName,
        x,
        y,
        options = {}
      ) {
        console.log(
          `SWORD SYSTEM PLAYING: ${effectName} at (${x}, ${y})`,
          options
        );
        const result = originalPlayEffect.call(this, effectName, x, y, options);
        console.log(`Effect result:`, result);
        return result;
      };
    }
  }, 1000); // Give game time to initialize
});

// Add debug display to show effects status
const updateDebugDisplay = function () {
  const debugDiv = document.getElementById("effects-debug");
  if (!debugDiv) return;

  // Check the A1EffectsLoader status
  const loader = window.A1EffectsLoader;
  const loadedStatus = loader?.loaded ? "READY" : "NOT LOADED";
  const effectCount = loader?.sprites
    ? Object.keys(loader.sprites).filter((k) => loader.sprites[k].length > 0)
        .length
    : 0;

  // Check if game.a1SwordEffects exists
  const gameRef = window.game?.a1SwordEffects ? "READY" : "NOT INITIALIZED";

  debugDiv.innerHTML = `
    <div>Effects Loader: <span class="${
      loader?.loaded ? "ready" : "not-ready"
    }">${loadedStatus}</span></div>
    <div>Loaded Effects: ${effectCount}</div>
    <div>Game Reference: <span class="${
      window.game?.a1SwordEffects ? "ready" : "not-ready"
    }">${gameRef}</span></div>
    <div class="debug-buttons">
      <button id="debug-reload">Reload Effects</button>
      <button id="debug-test">Test Effects</button>
    </div>
  `;

  // Add event listeners
  document.getElementById("debug-reload")?.addEventListener("click", () => {
    console.log("Manually reloading effects...");
    if (window.A1EffectsLoader) {
      window.A1EffectsLoader.loaded = false;
      window.A1EffectsLoader.initialize().then(() => {
        console.log("Effects reloaded successfully");
        updateDebugDisplay();
      });
    }
  });

  document.getElementById("debug-test")?.addEventListener("click", () => {
    console.log("Testing all effects...");
    if (window.game?.a1SwordEffects) {
      const x = window.game.player.x;
      const y = window.game.player.y;

      // Test each effect type
      const effects = [
        "sword_trail_blue",
        "slash_effect_red",
        "dark_aura",
        "twin_eclipse",
      ];

      let delay = 0;
      effects.forEach((effect) => {
        setTimeout(() => {
          console.log(`Testing effect: ${effect}`);
          window.game.a1SwordEffects.playEffect(effect, x, y);
        }, delay);
        delay += 1000; // Delay each effect by 1 second
      });
    }
  });
};

// Set up regular updates to the debug display
setInterval(updateDebugDisplay, 2000);

// Initialize the debug display when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Create debug display if it doesn't exist
  if (!document.getElementById("effects-debug")) {
    const debugDiv = document.createElement("div");
    debugDiv.id = "effects-debug";
    debugDiv.className = "effects-debug";
    document.body.appendChild(debugDiv);

    // Add CSS for debug display
    const style = document.createElement("style");
    style.textContent = `
      .effects-debug {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        z-index: 9999;
        font-size: 12px;
        border: 1px solid #555;
      }
      .effects-debug .ready {
        color: #4f4;
        font-weight: bold;
      }
      .effects-debug .not-ready {
        color: #f44;
        font-weight: bold;
      }
      .effects-debug .debug-buttons {
        margin-top: 10px;
        display: flex;
        gap: 5px;
      }
      .effects-debug button {
        padding: 3px 6px;
        font-size: 10px;
      }
    `;
    document.head.appendChild(style);
  }

  // Initial update
  updateDebugDisplay();
});
