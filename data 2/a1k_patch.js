
// == A1K Runner Patch: Gifts, Open-All, Basic Talents ========================
(function(){
  const LV_CAP = 101;
  const AP_PER_LEVEL = 1;
  const AP_FLAT = { atk:50, def:50, hp:50 };

  function safe(fn){ try{ return fn(); }catch(e){ /*console.warn(e)*/ } }

  // Wire toolbar if present
  function onReady(){
    const openAll = document.getElementById('btnOpenAllGifts');
    if(openAll && !openAll._wired){
      openAll._wired = true;
      openAll.onclick = openAllGifts;
      openAll.title = "Open all Gift Boxes in your Bag";
    }
    // Basic talent buttons
    ['btnTalentAtk','btnTalentDef','btnTalentHP'].forEach((id, idx)=>{
      const el = document.getElementById(id);
      if(el && !el._wired){
        el._wired = true;
        el.onclick = ()=> spendTalentAP(['atk','def','hp'][idx]);
      }
    });
    updateUnifiedAP();
  }
  document.addEventListener('DOMContentLoaded', onReady);
  setTimeout(onReady, 800);

  // 1) Force gift context menu to show Open instead of Equip
  // Monkey-patch the refreshInv if present, else fall back to MutationObserver.
  safe(()=>{
    const _origRefresh = window.refreshInv;
    window.refreshInv = function(){
      _origRefresh && _origRefresh();
      // adjust menu template after original builds it
      const menu = document.getElementById('itemMenu');
      if(!menu) return;
      // If a gift is selected, swap to Open/Sell menu
      const idx = window.st && window.st._menuIdx;
      const inv = window.inv;
      if(typeof idx==='number' && inv && inv[idx] && inv[idx].slot==='gift'){
        menu.innerHTML = '<button data-act="open">Open</button><button data-act="sell">Sell</button>';
      }
    };
  });

  // Also ensure menu reacts when user clicks a gift cell before refreshInv runs again
  document.addEventListener('click', function(){
    const menu = document.getElementById('itemMenu');
    const idx = window.st && window.st._menuIdx;
    const inv = window.inv;
    if(menu && typeof idx==='number' && inv && inv[idx] && inv[idx].slot==='gift'){
      menu.innerHTML = '<button data-act="open">Open</button><button data-act="sell">Sell</button>';
    }
  }, true);

  // 2) Open All Gifts helper uses the same click handler path as single 'open'
  function openAllGifts(){
    if(!window.inv) return;
    let opened = 0;
    for(let i=0;i<window.inv.length;i++){
      const it = window.inv[i];
      if(it && it.slot==='gift'){
        // Simulate the menu click path so loot logic stays identical
        const menu = document.getElementById('itemMenu');
        if(menu){
          window.st = window.st||{}; window.st._menuIdx = i;
          const btn = document.createElement('button'); btn.setAttribute('data-act','open');
          menu.dispatchEvent(new CustomEvent('click', { bubbles:true, cancelable:true, detail:{ target:btn } }));
        }else{
          // Fallback: do the open inline using the game's helper if available
          const slots = ['weapon','armor','acc1','acc2','pet'];
          const sl = slots[Math.floor(Math.random()*slots.length)];
          const makeItem = window.makeItem || ((n,sl,v)=>({name:n,slot:sl,atk:v}));
          window.inv[i] = makeItem('Gift Item', sl, 1 + Math.floor(Math.random()*4));
        }
        opened++;
      }
    }
    if(opened>0){
      safe(()=>window.refreshInv && window.refreshInv());
      safe(()=>window.refreshEquip && window.refreshEquip());
      safe(()=>window.recalcStats && window.recalcStats());
      safe(()=>window.updateCurrencies && window.updateCurrencies());
      safe(()=>window.addFloater && window.addFloater(window.DESIGN_W/2, 60, 'Opened '+opened+' gifts', '#ffd56a'));
    }
  }
  window.openAllGifts = openAllGifts;

  // 3) Very basic Talents/AP system (flat stat buttons)
  window.st = window.st || {};
  st.level = st.level || 1;
  st.ap = st.ap || 0;
  st.apSpent = st.apSpent || { atk:0, def:0, hp:0 };
  st._talentFlat = st._talentFlat || { atk:0, def:0, hp:0 };

  function gainLevel(n=1){
    st.level = Math.min(LV_CAP, (st.level||1) + n);
    st.ap = Math.min(200, (st.ap||0) + AP_PER_LEVEL*n);
    updateUnifiedAP();
  }
  window.gainLevel = gainLevel; // debug helper

  function spendTalentAP(stat){
    if(st.ap<=0) { safe(()=>addFloater(DESIGN_W/2,60,'No AP','#ff7a6a')); return; }
    if(!AP_FLAT[stat]) return;
    st.ap -= 1;
    st.apSpent[stat] = (st.apSpent[stat]||0) + 1;
    st._talentFlat[stat] = (st._talentFlat[stat]||0) + AP_FLAT[stat];
    // fold into live stats
    safe(()=>window.recalcStats && window.recalcStats());
    updateUnifiedAP();
    safe(()=>addFloater(DESIGN_W/2,60,'+'+AP_FLAT[stat]+' '+stat.uppercase || stat, '#6aa8ff'));
  }
  window.spendTalentAP = spendTalentAP;

  // Inject flat stats into damage/defense/HP via recalcStats() wrapper
  safe(()=>{
    const _recalc = window.recalcStats;
    window.recalcStats = function(){
      _recalc && _recalc();
      const t = st._talentFlat || {atk:0,def:0,hp:0};
      // Apply flat atk/def across team (lightweight; adapt if per-hero later)
      (st.players||[]).forEach(p=>{
        p.atk = Math.max(0, (p.atk||0) + (t.atk||0));
        p.defFlat = Math.max(0, (p.defFlat||0) + (t.def||0));
        p.maxHP = Math.max(1, (p.maxHP||100) + (t.hp||0));
      });
    };
  });

  function updateUnifiedAP(){
    const el = document.getElementById('talentAPCount');
    if(el){
      const spent = (st.apSpent.atk||0)+(st.apSpent.def||0)+(st.apSpent.hp||0);
      el.textContent = `${spent}/${Math.min(200, (st.ap||0)+spent)} — ${st.ap||0} AP available`;
    }
  }

  // Optional: double-click a cell to open gift instantly
  document.addEventListener('dblclick', (ev)=>{
    const cell = ev.target.closest && ev.target.closest('.slot');
    if(!cell) return;
    const idx = Array.from(document.querySelectorAll('#invGrid .slot')).indexOf(cell);
    if(idx>=0 && window.inv && window.inv[idx] && window.inv[idx].slot==='gift'){
      openAllGifts(); // simple: treat as open-all when double-clicking any gift
    }
  });
})();


  // 4) Make on-screen buttons and overhead bars bigger (best effort, DOM-only)
  function enlargeControls(){
    const btns = document.querySelectorAll('[data-ctrl], .ctrlBtn, .btnCircle, .hud .btn, #btnSwitch, #btnShield, #btnJump, #btnRage');
    btns.forEach(el=>{
      if(el._a1kSized) return;
      el._a1kSized = true;
      el.style.minWidth = el.style.minWidth || '72px';
      el.style.minHeight = el.style.minHeight || '72px';
      el.style.width = el.style.width || '72px';
      el.style.height = el.style.height || '72px';
      el.style.borderRadius = '50%';
      el.style.fontSize = '20px';
    });
    const bars = document.querySelectorAll('.overheadBar, .hpbar, .mpbar');
    bars.forEach(b=>{
      b.style.transform = 'scale(1.6)';
      b.style.transformOrigin = 'center';
    });
  }
  setInterval(enlargeControls, 800);
