
(function(){
  const list = [
    'assets/icons/gift.png','assets/icons/pet.png','assets/icons/vehicle.png',
    'assets/icons/atk.png','assets/icons/def.png','assets/icons/hp.png',
    'assets/spritesheets/gift_8x.png','assets/spritesheets/pet_8x.png','assets/spritesheets/vehicle_8x.png'
  ];
  function preload(srcs, cb){
    let left = srcs.length;
    srcs.forEach(src=>{
      const img = new Image();
      img.onload = img.onerror = ()=>{ left--; if(left===0) cb&&cb(); };
      img.src = src;
    });
  }
  window.addEventListener('DOMContentLoaded', ()=>{
    const box = document.getElementById('spriteLoaderStatus') || (function(){
      const d = document.createElement('div');
      d.id='spriteLoaderStatus';
      d.style.cssText='position:fixed;left:8px;bottom:8px;background:#101524;color:#cfe3ff;border:1px solid #24324a;padding:6px 10px;border-radius:8px;font:12px/1.2 monospace;z-index:9999;';
      d.textContent='Loading sprites...';
      document.body.appendChild(d);
      return d;
    })();
    preload(list, ()=> box.textContent='Sprites loaded');
  });
})();
