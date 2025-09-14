
(function(){
  const MANIFEST_URL = 'a1k_runner_assets/manifest_merged.json';
  async function boot(){
    try{
      const res = await fetch(MANIFEST_URL);
      if(!res.ok) throw new Error('manifest fetch failed ' + res.status);
      const manifest = await res.json();
      if (typeof window.registerSheets === 'function') window.registerSheets(manifest);
      if (typeof window.registerVFX === 'function') window.registerVFX(manifest);
      if (typeof window.registerUI === 'function') window.registerUI(manifest);
      window.A1K_MANIFEST = manifest;
      console.log('[A1K] Platform manifest loaded:', manifest.version);
    }catch(err){
      console.error('[A1K] boot error', err);
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else window.addEventListener('DOMContentLoaded', boot);
})();
