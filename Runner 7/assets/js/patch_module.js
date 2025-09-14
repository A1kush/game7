
/* A1K Runner Patch Module (autosell, gift open, equip rules, AP/level caps, pet/vehicle trees)
   Usage: include <script src="patch_module.js"></script> after your main game script.
   It expects a global 'st' (state) similar to A1K Runner v2/v3. If not found, it falls back to a demo.
*/
(function(global){
  const Patch = {};
  const PRICE = { common:100, gift_box:200, rare:300, epic:600, legendary:1200 };
  const CAPS = { player:101, pet:50, vehicle:20 };
  const TREE_CAP = { pets:40, vehicles:30, talents:200 };
  const PER_LEVEL = { pets:2, vehicles:2, talents:1 }; // AP per level (talents=1)
  const PER_POINT = { atk:50, def:50, hp:50 };

  const hasGame = typeof global.st === 'object';

  // Minimal bag API shim
  function bag(){ 
    if (hasGame){ if (!Array.isArray(st.bag)) st.bag=[]; return st.bag; }
    global.__demoGold = global.__demoGold||0;
    global.__demoBag = global.__demoBag||[
      {type:'item', name:'Potion', rarity:'common'},
      {type:'gift', name:'Gift Box', rarity:'common'},
      {type:'gear', name:'Blade +1', slot:'weapon', rarity:'common'},
      {type:'gear', name:'Helm +1', slot:'helm', rarity:'rare'},
      {type:'gift', name:'Gift Box', rarity:'common'}
    ];
    return global.__demoBag;
  }
  function setBag(v){ if (hasGame) st.bag=v; else global.__demoBag=v; }
  function addGold(n){ if (hasGame){ st.gold=(st.gold||0)+n; if (global.updateCurrencies) updateCurrencies(); } else { global.__demoGold=(global.__demoGold||0)+n; } }

  function isGift(it){ return it.type==='gift' || /gift/i.test(it.name||''); }
  function isGear(it){ return it.type==='gear'; }
  function gearProtected(it){ 
    const r=(it.rarity||'common').toLowerCase();
    return isGear(it) && (r==='rare' || r==='epic' || r==='legendary');
  }
  function priceFor(it){
    const r=(it.rarity||'common').toLowerCase();
    if (isGift(it)) return PRICE.gift_box;
    if (isGear(it)) return PRICE[r]||PRICE.common;
    return PRICE.common;
  }

  Patch.autoSellAll = function(){
    const src=bag(); let kept=[], earned=0;
    for (const it of src){
      if (gearProtected(it)) { kept.push(it); continue; }
      if (isGear(it) || it.type==='item' || isGift(it)){ earned += priceFor(it); }
      else { kept.push(it); }
    }
    addGold(earned);
    setBag(kept);
    toast(`Auto‑sold for +${earned}G`);
    Patch.renderBag && Patch.renderBag();
    return {earned, kept:kept.length};
  };

  function rollGift(){
    const r=Math.random();
    if (r<0.55){ addGold(100+Math.floor(Math.random()*150)); return 'Gold'; }
    if (r<0.85){ if (hasGame){ st.giftKeys=(st.giftKeys||0)+1; } return 'Gift Key'; }
    const rank=['C','B','A','S'][Math.floor(Math.random()*4)];
    const rarity = rank==='S'?'legendary' : rank==='A'?'epic' : rank==='B'?'rare' : 'common';
    const g={type:'gear', name:`Random Gear ${rank}`, slot:'weapon', rarity};
    const b=bag(); b.push(g); setBag(b);
    return `Gear ${rank}`;
  }

  Patch.openAllGifts = function(){
    const b=bag(); let opened=0, rewards=[];
    for (let i=b.length-1;i>=0;--i){
      if (isGift(b[i])){ rewards.push(rollGift()); b.splice(i,1); opened++; }
    }
    setBag(b);
    Patch.renderBag && Patch.renderBag();
    toast(opened?`Opened ${opened} gifts: ${rewards.slice(0,3).join(', ')}${rewards.length>3?'…':''}`:'No gifts');
    return opened;
  };

  // Equip rules
  const HEROES=['A1','Unique','Missy'];
  function heroInv(){ if (hasGame){ st.loadouts=st.loadouts||{A1:{},Unique:{},Missy:{}}; return st.loadouts; } global.__demoLoad={A1:{},Unique:{},Missy:{}}; return global.__demoLoad; }

  Patch.autoEquipAll = function(){
    const b=bag();
    const load=heroInv();
    // reset loadouts (no sharing)
    for (const h of HEROES) load[h] = {};
    // greedy assign highest rarity per slot per hero
    const order = {'legendary':4,'epic':3,'rare':2,'common':1};
    const pool = b.filter(isGear).sort((a,b)=> (order[(b.rarity||'common')]||0)-(order[(a.rarity||'common')]||0));
    for (const h of HEROES){
      for (const it of pool){
        if (it._assigned) continue;
        const slot = it.slot||'weapon';
        if (!load[h][slot]){ load[h][slot]=it; it._assigned=true; }
      }
    }
    // remove assigned from bag
    setBag(b.filter(x=>!x._assigned));
    Patch.renderBag && Patch.renderBag();
    toast('Auto‑equipped all heroes (no sharing)');
    return load;
  };

  // Level & AP system
  function ensureProg(){
    if (!hasGame){
      global.__demoLvl = global.__demoLvl||1;
      global.__demoXP = global.__demoXP||0;
      global.__demoAP = global.__demoAP||0;
      return;
    }
    st.level = st.level||1; st.xp=st.xp||0; st.apTotal=st.apTotal||0; st.apSpent=st.apSpent||0;
    st.petLevel = st.petLevel||1; st.petXP = st.petXP||0; st.petPoints = st.petPoints||0;
    st.vehLevel = st.vehLevel||1; st.vehXP = st.vehXP||0; st.vehPoints = st.vehPoints||0;
  }

  function xpToNext(L){ return 50 + 25*L + 5*L*L; } // simple curve
  Patch.addXP = function(n, source='player'){
    ensureProg();
    if (!hasGame){ global.__demoXP += n; while (global.__demoXP >= xpToNext(global.__demoLvl) and False){} return; }
    if (source==='player'){
      st.xp += n;
      while (st.level < CAPS.player && st.xp >= xpToNext(st.level)){ st.xp -= xpToNext(st.level); st.level++; st.apTotal += PER_LEVEL.talents; }
    } else if (source==='pet'){
      st.petXP += n;
      while (st.petLevel < CAPS.pet && st.petXP >= xpToNext(st.petLevel)){ st.petXP -= xpToNext(st.petLevel); st.petLevel++; st.petPoints = Math.min(TREE_CAP.pets, st.petPoints + PER_LEVEL.pets); }
    } else if (source==='vehicle'){
      st.vehXP += n;
      while (st.vehLevel < CAPS.vehicle && st.vehXP >= xpToNext(st.vehLevel)){ st.vehXP -= xpToNext(st.vehLevel); st.vehLevel++; st.vehPoints = Math.min(TREE_CAP.vehicles, st.vehPoints + PER_LEVEL.vehicles); }
    }
    if (hasGame && typeof updateXPUI==='function') updateXPUI();
  };

  // Talents stat application (+50 to all three per point)
  Patch.applyTalentStats = function(){
    if (!hasGame) return;
    const picks = st.apSpent || 0;
    st.bonus = st.bonus || {atk:0,def:0,hp:0};
    st.bonus.atk = picks * PER_POINT.atk;
    st.bonus.def = picks * PER_POINT.def;
    st.bonus.hp  = picks * PER_POINT.hp;
  };

  // Tiny toast helper
  function toast(msg){
    const id='notifWrap';
    let wrap=document.getElementById(id);
    if (!wrap){ wrap=document.createElement('div'); wrap.id=id; wrap.style.position='fixed'; wrap.style.top='14px'; wrap.style.right='14px'; wrap.style.zIndex='10000'; document.body.appendChild(wrap); }
    const t=document.createElement('div'); t.textContent=msg; t.style.cssText='background:#0f1826;border:1px solid #293854;color:#cfe3ff;border-radius:8px;padding:6px 10px;margin-top:6px;opacity:.95';
    wrap.appendChild(t); setTimeout(()=>t.remove(), 2200);
  }

  // Minimal bag renderer for demo/testing and to plug into your overlay
  Patch.renderBag = function(){
    const grid = document.getElementById('bagGrid') || document.getElementById('invGrid');
    if (!grid) return;
    const b=bag(); grid.innerHTML='';
    b.forEach((it,i)=>{
      const div=document.createElement('div');
      div.className='slot-box item';
      div.textContent=(isGear(it)?'Gear: ':'') + (it.name||'Item');
      grid.appendChild(div);
    });
  };

  // UI wire‑up for Inventory overlay
  Patch.injectButtons = function(){
    // Check if buttons already exist in HTML (they do in index - Copy.html)
    const sellBtn = document.getElementById('btnAutoSell');
    const openBtn = document.getElementById('btnOpenAllGifts');
    const equipBtn = document.getElementById('btnAutoEquip');

    // If buttons exist, enhance them with patch functionality
    if (sellBtn && openBtn && equipBtn) {
      console.log('Using existing buttons from HTML');
      return; // HTML already has working buttons
    }

    // Fallback: inject buttons if they don't exist
    const header = document.querySelector('#inventory .bag-header') || document.querySelector('#inventory_old h3');
    if (!header) return;
    const ctn = document.createElement('span'); ctn.style.marginLeft='8px';
    ctn.innerHTML = `
      <button id="btnAutoSell" class="btn">Auto Sell</button>
      <button id="btnOpenAllGifts" class="btn">Open All Gifts</button>
      <button id="btnAutoEquip" class="btn">Auto Equip (All)</button>
    `;
    header.appendChild(ctn);
    document.getElementById('btnAutoSell').onclick = Patch.autoSellAll;
    document.getElementById('btnOpenAllGifts').onclick = Patch.openAllGifts;
    document.getElementById('btnAutoEquip').onclick = Patch.autoEquipAll;
  };

  Patch.init = function(){
    Patch.injectButtons();
    Patch.renderBag();
  };

  global.A1KPatch = Patch;
})(window);
