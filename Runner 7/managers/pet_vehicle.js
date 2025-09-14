// Pet and Vehicle managers (guarded usage; define only)
// Requires game systems: Inventory, Player, VFX, World, Projectiles, Input, Runner, Time

const PetManager = {
  active: null,
  summonFromEquipped(owner='A1') {
    try {
      if (!window.Inventory || !window.Player) return console.warn('No Inventory/Player available');
      const petItem = Inventory.getEquipped?.('pet');
      if (!petItem) { if (typeof toast==='function') toast('No pet equipped'); return; }
      this.active = {
        id:`pet_${Date.now()}`, hp:200, hpMax:200, owner, state:'follow',
        pos:{x:Player.leader().x-20,y:Player.leader().y-10},
        vel:{x:0,y:0}, stats:(typeof mergeStats==='function'? mergeStats({hp:200}, petItem.stats||{}) : (petItem.stats||{})), equippedFrom:petItem.id
      };
      if (window.VFX?.spawn) VFX.spawn('aura_gear', this.active.pos.x, this.active.pos.y);
    } catch(e){ console.warn('PetManager.summonFromEquipped error', e); }
  },
  update(dt){
    try {
      const p = this.active; if(!p) return;
      const lead = window.Player?.leader?.(); if(!lead) return;
      // naive helpers expected in game code
      const d = (a,b)=> Math.hypot((a.x||a.pos?.x||0)-(b.x||b.pos?.x||0),(a.y||a.pos?.y||0)-(b.y||b.pos?.y||0));
      const seek = (ent, target, speed)=>{
        const tx = target.x - ent.pos.x, ty = target.y - ent.pos.y, len=Math.hypot(tx,ty)||1; ent.vel.x = tx/len*speed; ent.vel.y = ty/len*speed; ent.pos.x += ent.vel.x*(dt||0.016); ent.pos.y += ent.vel.y*(dt||0.016);
      };
      const proj = window.World?.findIncomingProjectileNear?.(p.pos, 160);
      const mob  = window.World?.findNearestEnemy?.(p.pos, 220);
      if (proj) p.state='intercept';
      else if (mob && d(p,mob)<200) p.state='attack';
      else if (mob && d(p,mob)<120) p.state='dash';
      else p.state='follow';

      if (p.state==='follow') {
        seek(p, {x:lead.x-32,y:lead.y-8}, 240);
      } else if (p.state==='intercept') {
        const fp = typeof proj?.futurePoint==='function' ? proj.futurePoint(0.3) : proj?.pos || p.pos;
        seek(p, fp, 300);
        if (window.World?.overlaps?.(p.pos, proj?.pos, 14)) proj?.pop?.();
      } else if (p.state==='attack') {
        if (typeof tick==='function' && tick(0.35)) {
          window.Projectiles?.spawn?.('pet_bolt', p.pos, (typeof dirTo==='function'? dirTo(p.pos,mob.pos):0), p.stats);
          try { // simple visual burst using aura as placeholder
            if (window.VFX?.spawn) VFX.spawn('aura_gear', p.pos.x, p.pos.y);
            else if (window.UnifiedAssets){
              const src = UnifiedAssets.path('vfx.aura_gear');
              const img = document.createElement('img'); img.src = src; img.style.cssText = 'position:absolute;left:'+(p.pos.x||0)+'px;top:'+(p.pos.y||0)+'px;width:32px;height:32px;pointer-events:none;opacity:0.85;transform:translate(-50%,-50%)'; (document.getElementById('wrap')||document.body).appendChild(img); setTimeout(()=>img.remove(), 360);
            }
          } catch {}
          (window.Telemetry||(window.Telemetry={})).petShots = ((window.Telemetry.petShots||0)+1);
        }
        seek(p, {x:mob.x-18,y:mob.y}, 200);
      } else if (p.state==='dash') {
        if (typeof dashTo==='function') dashTo(p, mob.pos, 480, 0.18, (hit)=>{ try{ mob?.takeDamage?.(18+(p.stats?.atk||0)); (window.Telemetry||(window.Telemetry={})).petHits=((window.Telemetry.petHits||0)+1); }catch{} });
      }
    } catch(e){ console.warn('PetManager.update error', e); }
  }
};

const VehicleManager = {
  active:null,
  callFromEquipped(){
    try {
      if (!window.Inventory || !window.Player) return console.warn('No Inventory/Player available');
      const vehItem = Inventory.getEquipped?.('veh');
      if(!vehItem) { if (typeof toast==='function') toast('No vehicle equipped'); return; }
      const lead = Player.leader();
      this.active = {
        id:`veh_${Date.now()}`, hp:200, hpMax:200, seats:3, occupants:[],
        pos:{x:lead.x+24,y:lead.y}, vel:{x:0,y:0},
        stats:(typeof mergeStats==='function'? mergeStats({hp:200,def:10,spd:20}, vehItem.stats||{}) : (vehItem.stats||{})), equippedFrom:vehItem.id
      };
      if (window.VFX?.spawn) VFX.spawn('aura_gear', this.active.pos.x, this.active.pos.y);
    } catch(e){ console.warn('VehicleManager.callFromEquipped error', e); }
  },
  tryBoard(mode='all'){
    try {
      const v=this.active; if(!v) return; if (!window.Player) return;
      const all = (typeof Player.all==='function') ? Player.all() : [];
      const leader = (typeof Player.leader==='function') ? [Player.leader()] : [];
      const squad = mode==='all' ? all : leader;
      const dist = (a,b)=> Math.hypot(a.pos.x-b.pos.x,a.pos.y-b.pos.y);
      const seek = (h, target, speed)=>{ const tx=target.x-h.pos.x, ty=target.y-h.pos.y, len=Math.hypot(tx,ty)||1; h.pos.x += (tx/len)*((speed||220)*(1/60)); h.pos.y += (ty/len)*((speed||220)*(1/60)); };
      for(const h of squad){
        if(v.occupants.length>=v.seats) break;
        if(dist(h,v)<=36){ v.occupants.push(h.id); h.visible=false; h.controlDisabled=true; (window.Telemetry||(window.Telemetry={})).vehBoards=((window.Telemetry.vehBoards||0)+1); v._boardTimes=v._boardTimes||{}; v._boardTimes[h.id]=performance.now(); }
        else seek(h, v.pos, 220);
      }
    } catch(e){ console.warn('VehicleManager.tryBoard error', e); }
  },
  update(dt){
    try {
      const v=this.active; if(!v) return;
      if (typeof Runner?.speed==='function') v.vel.x = Runner.speed();
      v.pos.x += (v.vel.x||0)*(dt||0.016); v.pos.y += (v.vel.y||0)*(dt||0.016);
      if (window.Input?.justPressed?.('Jump') && v.occupants.length){
        const id=v.occupants.shift(); const h=window.Player?.byId?.(id);
        if (h){ h.visible=true; h.controlDisabled=false; h.pos={x:v.pos.x+16,y:v.pos.y-10};
          try{ const t0=(v._boardTimes&&v._boardTimes[id])||performance.now(); const dtStay=(performance.now()-t0)/1000; (window.Telemetry||(window.Telemetry={})).vehTime=((window.Telemetry.vehTime||0)+dtStay); }catch{}
        }
      }
    } catch(e){ console.warn('VehicleManager.update error', e); }
  }
};

window.PetManager = PetManager;
window.VehicleManager = VehicleManager;
