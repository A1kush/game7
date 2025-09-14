
// A1K Inventory expansion, auto-route, auto-upgrade
window.A1K = window.A1K || {};
A1K.inv = A1K.inv || {
  panels: { gear: {maxSlots: 36}, pets: {maxSlots: 20}, vehicles: {maxSlots: 16}, talents:{maxSlots: 12} },
  items: { gear:[], pets:[], vehicles:[], talents:[] },
  prefs: { keepRarePlus:true, rankWeight:{Common:1, Gift:1.2, Rare:1.6, Epic:2.1, Legendary:3.0} }
};

A1K.expandInventory = function(){
  A1K.inv.panels.gear.maxSlots     += 5;
  A1K.inv.panels.pets.maxSlots     += 5;
  A1K.inv.panels.vehicles.maxSlots += 5;
  A1K.inv.panels.talents.maxSlots  += 5;
  localStorage.setItem('a1k_inv', JSON.stringify(A1K.inv));
};

A1K.routeItem = function(item){
  // item: {type:'weapon|armor|accessory|pet|pet_box|vehicle|vehicle_box|talent', ...}
  const t = item.type;
  if(['weapon','armor','accessory'].includes(t)) { A1K.inv.items.gear.push(item); }
  else if(['pet','pet_box'].includes(t)) { A1K.inv.items.pets.push(item); }
  else if(['vehicle','vehicle_box'].includes(t)) { A1K.inv.items.vehicles.push(item); }
  else { A1K.inv.items.talents.push(item); }
  localStorage.setItem('a1k_inv', JSON.stringify(A1K.inv));
};

A1K.scoreItem = function(it){
  const base = (it.atk||0) + (it.def||0);
  const rw = A1K.inv.prefs.rankWeight[it.rank||'Common'] || 1;
  return base * rw;
};

A1K.autoUpgrade = function(charSheet){
  // charSheet: { slots:{weapon:null, armor:null, accessory:null}, prefs? }
  const gear = A1K.inv.items.gear;
  const best = { weapon:null, armor:null, accessory:null };
  for(const it of gear){
    if(!['weapon','armor','accessory'].includes(it.type)) continue;
    if(A1K.inv.prefs.keepRarePlus && ['Rare','Epic','Legendary'].includes(it.rank)){
      // keep protected; still allowed to equip if it's best
    }
    const slot = it.type;
    if(!best[slot] || A1K.scoreItem(it) > A1K.scoreItem(best[slot])) best[slot] = it;
  }
  // Equip selected
  for(const slot of ['weapon','armor','accessory']){
    if(best[slot]) charSheet.slots[slot] = best[slot];
  }
  return charSheet;
};

// Example pricing table respected elsewhere
A1K.prices = { Common:100, Gift:200 };
