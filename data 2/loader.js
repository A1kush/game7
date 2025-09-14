
// Simple asset loader for A1K patch bundle
window.A1KAssets = (function(){
  const manifest = {
    icons: {
      ability: "assets/icons/ability_point.png",
      pets: "assets/icons/pets_point.png",
      gear: "assets/icons/gear_point.png",
      vehicles: "assets/icons/vehicles_point.png",
    },
    spritesheets: {
      pointGlow: "assets/spritesheets/point_glow_strip8_64x64.png"
    },
    gifs: {
      pointGlow: "assets/gifs/point_glow.gif"
    }
  };

  async function loadImage(src){
    return new Promise((resolve, reject)=>{
      const img = new Image(); img.onload = ()=>resolve(img); img.onerror = reject; img.src = src;
    });
  }

  async function loadAll(){
    const out = { images: {}, manifest };
    const jobs = [];
    for (const [cat, m] of Object.entries(manifest)){
      if (cat === "gifs") continue; // gif used directly via <img>
      out.images[cat] = {};
      for (const [key, src] of Object.entries(m)){
        jobs.push(loadImage(src).then(img=> out.images[cat][key] = img));
      }
    }
    await Promise.all(jobs);
    return out;
  }

  return { manifest, loadAll };
})();
