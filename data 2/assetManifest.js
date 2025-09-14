/**
 * Asset Manifest - Contains references to all game assets
 */
const AssetManifest = {
  images: {
    'player': './assets/images/player.png',
    'background': './assets/images/background.png',
    'obstacle': './assets/images/obstacle.png',
    'logo': './assets/images/logo.png'
    // Add more images as needed
  },
  
  // You can add other asset types here as well (audio, data, etc.)
  audio: {
    // 'jump': './assets/audio/jump.mp3'
  }
};

// Export the manifest for use in other files
window.AssetManifest = AssetManifest;
