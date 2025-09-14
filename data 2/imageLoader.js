/**
 * Single image loader with promise-based API
 */
class ImageLoader {
  /**
   * Load a single image
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>} Promise resolving to the loaded image
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      
      img.src = src;
    });
  }
  
  /**
   * Load multiple images at once
   * @param {string[]} sources - Array of image source URLs
   * @returns {Promise<HTMLImageElement[]>} Promise resolving to an array of loaded images
   */
  static loadImages(sources) {
    const promises = sources.map(src => this.loadImage(src));
    return Promise.all(promises);
  }
}

// Export for module systems
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = ImageLoader;
}
