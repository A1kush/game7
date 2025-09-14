// iepv.js - Enhanced Inventory / Equipment / Pet / Vehicle extensions
// Non-destructive augment layered on top of existing inline inventory logic in A1K Runner.htm
(function(){
  if(window.__IEPV_INIT__) return; window.__IEPV_INIT__=true;
  const g = (typeof window.game!=='undefined')? window.game : null;
  const tooltip = document.getElementById('comparisonTooltip');
  const menu = document.getElementById('itemMenu');
  if(menu) menu.classList.add('iepv');

  // Attempt to hook into existing structures
  const st = (g && g.st) ? g.st : window.st;
  if(!st){ console.warn('[IEPV] state not found; aborting early'); return; }

  // Track favorites / locked using maps keyed by item id
  const fav = new Set();
  const locked = new Set();

  // Rarity mapping if absent
  const rarityOrder = ['Common','Rare','Epic','Legendary'];

  function classifySlot(el, it){
    if(!el) return; if(!it){ el.classList.remove('filled','common','rare','epic','legendary','favorited','locked'); return; }
    el.classList.add('filled');
    const r = (it.rarity||'Common').toLowerCase();
    ['common','rare','epic','legendary'].forEach(c=>el.classList.remove(c));
    if(['common','rare','epic','legendary'].includes(r)) el.classList.add(r);
    if(fav.has(it.id)) el.classList.add('favorited'); else el.classList.remove('favorited');
    if(locked.has(it.id)) el.classList.add('locked'); else el.classList.remove('locked');
  }

  // Patch existing refreshInv to add rarity classes & context entries
  let origRefreshInv = window.refreshInv || null;
  window.refreshInv = function(){
    if(origRefreshInv) origRefreshInv();
    const grid = document.getElementById('invGrid');
    if(!grid) return;
    // annotate cells
    [...grid.children].forEach((cell,idx)=>{
      const invArr = window.inv || window.inventory || []; // original uses inv (scoped) but we try global fallback
      const it = (window.inv? window.inv[idx] : null);
      classifySlot(cell,it);
      if(it){
        cell.onmouseenter = ()=> showComparison(it, cell.getBoundingClientRect());
        cell.onmouseleave = ()=> hideComparison();
      }
    });
    enhanceContextMenu();
  };

  // Attempt to patch equip refresh too
  let origRefreshEquip = window.refreshEquip || null;
  window.refreshEquip = function(){
    if(origRefreshEquip) origRefreshEquip();
    const equipBox = document.getElementById('equip');
    if(!equipBox) return;
    [...equipBox.children].forEach(cell=>{
      const txt = cell.textContent||'';
      // cannot easily map back to item; skip for now
    });
  };

  function enhanceContextMenu(){
    const menu = document.getElementById('itemMenu');
    if(!menu || menu.__iepvEnhanced) return;
    menu.__iepvEnhanced = true;
    menu.addEventListener('click', (e)=>{
      const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if(!act) return;
      const idx = st._menuIdx; if(idx==null) return;
      const it = window.inv? window.inv[idx]:null; if(!it) return;
      if(act==='favorite'){ toggleFavorite(it); menu.style.display='none'; window.refreshInv && window.refreshInv(); }
      else if(act==='lock'){ toggleLock(it); menu.style.display='none'; window.refreshInv && window.refreshInv(); }
    }, true);

    // Intercept open to inject our extra buttons
    const observer = new MutationObserver(()=>{
      if(menu.style.display!=='none' && !menu.querySelector('[data-act="favorite"]')){
        const frag = document.createDocumentFragment();
        const sep = document.createElement('div'); sep.className='separator'; frag.appendChild(sep);
        const favBtn = document.createElement('button'); favBtn.textContent='Favorite / Unfavorite'; favBtn.setAttribute('data-act','favorite'); frag.appendChild(favBtn);
        const lockBtn = document.createElement('button'); lockBtn.textContent='Lock / Unlock'; lockBtn.setAttribute('data-act','lock'); frag.appendChild(lockBtn);
        menu.appendChild(frag);
      }
    });
    observer.observe(menu,{childList:true,subtree:true});
  }

  function toggleFavorite(it){ if(!it) return; if(fav.has(it.id)) fav.delete(it.id); else fav.add(it.id); }
  function toggleLock(it){ if(!it) return; if(locked.has(it.id)) locked.delete(it.id); else locked.add(it.id); }

  function showComparison(candidate, rect){
    if(!candidate){ hideComparison(); return; }
    // Determine currently equipped for that slot on current hero
    const heroIdx = st._gearHero || 0; const heroId = ['A1','Unique','Missy'][heroIdx];
    const equipMap = window.equipMap || (window.getEquipMap && window.getEquipMap());
    let current = null; if(equipMap && equipMap[heroId]) current = equipMap[heroId][candidate.slot];
    if(!current || current===candidate){ hideComparison(); return; }
    const atkDiff = (candidate.atk||0) - (current.atk||0);
    tooltip.innerHTML = `<h4>${candidate.name}</h4>` +
      `<div class="cmp-row"><span>Current</span><span>${current.name}</span></div>`+
      `<div class="cmp-row"><span>ATK</span><span>${current.atk||0}</span></div>`+
      `<div class="cmp-row"><span>Candidate ATK</span><span>${candidate.atk||0} ${formatDiff(atkDiff)}</span></div>`;
    positionTooltip(rect);
  }
  function hideComparison(){ if(tooltip){ tooltip.style.display='none'; } }
  function positionTooltip(rect){ if(!tooltip||!rect) return; tooltip.style.display='block'; const pad=8; let x=rect.right+pad; let y=rect.top; if(x+300>innerWidth) x = rect.left-300-pad; if(x<0) x=pad; if(y+tooltip.offsetHeight>innerHeight) y=innerHeight-tooltip.offsetHeight-pad; tooltip.style.left=x+'px'; tooltip.style.top=y+'px'; }
  function formatDiff(n){ if(!n) return ''; return `<span class="${n>0?'pos':'neg'}">(${n>0?'+':''}${n})</span>`; }

  // Safety: refresh once after initial load assets
  setTimeout(()=>{ try{ window.refreshInv && window.refreshInv(); }catch(e){ console.warn('[IEPV] initial refresh failed',e);} }, 1000);
})();
