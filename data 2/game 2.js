/**
 * Game - Main game class that uses the ImageLoader
 */
class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.imageLoader = new ImageLoader();
    this.images = {};
    this.isLoading = true;
    this.loadProgress = 0;
    
    this.init();
  }
  
  init() {
    // Setup canvas
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Start loading assets
    this.loadAssets();
  }
  
  loadAssets() {
    const loadingElement = document.getElementById('loading-progress');
    
    this.imageLoader
      .onProgress(progress => {
        this.loadProgress = progress;
        if (loadingElement) {
          loadingElement.innerText = `Loading: ${Math.round(progress * 100)}%`;
        }
      })
      .onComplete(images => {
        this.images = images;
        this.isLoading = false;
        this.start();
        
        if (loadingElement) {
          loadingElement.style.display = 'none';
        }
      });
      
    // Load all images from the manifest
    this.imageLoader.loadManifest(AssetManifest.images)
      .catch(error => {
        console.error('Failed to load game assets:', error);
      });
  }
  
  start() {
    console.log('All assets loaded, starting game!');
    
    // Start the game loop
    this.update();
    
    // Draw something with the loaded images
    this.drawSample();
  }
  
  update() {
    // Game update logic would go here
    requestAnimationFrame(() => this.update());
  }
  
  drawSample() {
    // Clear canvas
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw loaded images as examples
    let y = 50;
    for (const [key, img] of Object.entries(this.images)) {
      this.ctx.drawImage(img, 50, y, 100, 100);
      
      // Draw image name
      this.ctx.fillStyle = 'white';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(key, 160, y + 50);
      
      y += 120;
    }
  }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
  new Game('gameCanvas');
});
