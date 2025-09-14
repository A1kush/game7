import { preloadAssets } from './loader.js';
import { bindUI } from './enhanced-ui.js';
const cv = document.getElementById('cv'); const ctx = cv.getContext('2d');
function fitCanvas(){ const r=1280/720; const w=Math.min(innerWidth,1280); const h=Math.min(innerHeight,w/r); cv.style.width=w+'px'; cv.style.height=h+'px'; }
addEventListener('resize', fitCanvas); fitCanvas();
(async function main(){ bindUI(); const count=await preloadAssets(); console.log('Assets loaded:', count);
  function loop(){ ctx.fillStyle='#0b1421'; ctx.fillRect(0,0,cv.width,cv.height);
    const entries = Object.values(window.ASSETS || {});
    const bg = entries.find(e=>/backgrounds\//.test(e.path) || e.category==='backgrounds');
    if (bg?.img) ctx.drawImage(bg.img, 0, 0);
    requestAnimationFrame(loop);
  } loop();
})();