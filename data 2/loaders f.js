export const ASSETS = {};
async function loadManifest(){ const r=await fetch('assets/manifest.json'); return r.json(); }
function loadImage(entry){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(Object.assign(entry,{img})); img.onerror=()=>resolve(null); img.src=entry.path; }); }
export async function preloadAssets(){
  const m=await loadManifest(); const entries=(m.files||[]).filter(e=>/\.(png|gif|webp|jpg|jpeg)$/i.test(e.path));
  const results = await Promise.all(entries.map(loadImage));
  for(const e of results){ if(!e) continue; const k=e.path.replace(/^assets\//,'').replace(/\.[^.]+$/,''); ASSETS[k]=e; }
  return Object.keys(ASSETS).length;
}
