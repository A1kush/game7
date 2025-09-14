
/* =============================================================
   Special 200G Button Patch
   - Adds a "Treasure Crawl (200G)" button next to #btnDungeon (if present),
     otherwise falls back to a fixed-position button.
   - On click: deducts EXACTLY 200 gold, updates HUD, and:
       * If startTreasureCrawlV2() exists, launches the PMD mini-game.
       * Else, grants +1 Gift Key as a fallback.
   - Idempotent: won't add duplicates if included twice.
   ============================================================= */
(function(){
  function insertButton(){
    if (document.getElementById('btnSpecial200')) return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'btnSpecial200';
    btn.textContent = 'Treasure Crawl (200G)';
    // Try to place after #btnDungeon
    const d = document.getElementById('btnDungeon');
    if (d && d.parentNode){
      if (d.nextSibling) d.parentNode.insertBefore(btn, d.nextSibling);
      else d.parentNode.appendChild(btn);
    } else {
      // Fallback placement
      btn.style.position = 'fixed';
      btn.style.right = '12px';
      btn.style.bottom = '12px';
      btn.style.zIndex = 9999;
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', onBuy);
  }

  function onBuy(){
    try{
      if (!window.st){
        console.warn('[200G] No game state (st) found.');
        alert('Game state not ready.');
        return;
      }
      const COST = 200;
      const gold = st.gold|0;
      if (gold < COST){
        if (typeof addFloater==='function') addFloater((window.DESIGN_W||800)/2, 60, 'Need 200 Gold', '#ff7a6a');
        return;
      }
      st.gold = gold - COST;
      if (typeof updateCurrencies==='function') updateCurrencies();
      if (typeof addFloater==='function') addFloater((window.DESIGN_W||800)/2, 60, '-200G', '#ffd56a');

      // Preferred effect: launch mini-game if available
      if (typeof startTreasureCrawlV2 === 'function'){
        startTreasureCrawlV2();
        if (typeof addFloater==='function') addFloater((window.DESIGN_W||800)/2, 80, 'Treasure Crawl!', '#8fb6ff');
      } else {
        // Fallback: grant +1 Gift Key
        st.giftKeys = (st.giftKeys||0) + 1;
        if (typeof updateCurrencies==='function') updateCurrencies();
        if (typeof addFloater==='function') addFloater((window.DESIGN_W||800)/2, 80, '+1 Gift Key', '#8fb6ff');
      }
    }catch(err){
      console.error('[200G] Error:', err);
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', insertButton);
  } else {
    insertButton();
  }
})();
