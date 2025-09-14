// A1K v13.7 — key gates (engine-agnostic)
// v13.7 damage override (centralized)
const DMG_OVR = (PATCH?.overrides?.enable_v13_7_damage_overrides === true) || false;
function applySkillDamage(base){
  const mul = (PATCH?.overrides?.skill_damage_multiplier) || 1.30;
  return DMG_OVR ? Math.round(base * mul) : base;
}
function applySkillDmg(n){ return applySkillDamage(n); }

// Unique basic spawn
function onUniqueBasicSpawn(proj){
  proj.scale *= 1.35;
  proj.knockback = { force: 220, max_targets: rndInt(3,5), vsBoss:false };
  proj.homing.enabled = true; proj.homing.turn_deg_per_s = 280;
  proj.addStatusOnHit('atk_down', 5.0);
  if (DMG_OVR) proj.setDamageRng(100,230);
}

// A1 melee-only (5-hit combo)
const A1_COMBO = [
  { reflectSec: 1.0, maxRefl: [2,6], dmg: [80,150] },
  { reflectSec: 1.0, maxRefl: [2,6], dmg: [90,160] },
  { reflectSec: 1.1, maxRefl: [3,7], dmg: [100,170] },
  { reflectSec: 1.2, maxRefl: [3,7], dmg: [110,180] },
  { reflectSec: 1.4, maxRefl: [4,8], dmg: [140,240], finisher: true }
];

function A1_basicFire(){ A1.playMeleeCombo(); } // no gun
function A1_onSwing(i){
  const step = A1_COMBO[i % A1_COMBO.length];
  openReflectWindow(step.reflectSec, rndInt(step.maxRefl[0], step.maxRefl[1]));
  if (DMG_OVR && i.target) {
    const [d1, d2] = step.dmg;
    applyDamage(i.target, rndInt(d1, d2));
  }
  if (step.finisher) {
    // Optional: add finisher effects like extra VFX or stun
    // e.g., applyStatus(i.target, 'stun', 2.0);
  }
}

// Missy pistol dizzy
function onMissyPistolHit(target){
  if (!target.isBoss) applyStatus(target, 'dizzy', 5.0);
  if (DMG_OVR) applyDamage(target, rndInt(40,100));
}


// Center-line clamp
function clampEnemy(e){
  if (e.pos.x < CENTER_X){ e.pos.x = CENTER_X; e.vel.x = Math.max(0,e.vel.x); }
}

// Ally AI item use
function aiMaybeUseItem(ally){
  if (ally.hp <= ally.hpMax * 0.35 && hasConsumable('hp_pack')){
    useItem('hp_pack'); toast(`${ally.name} used HP Kit`);
  }
}

// Game over gating
if (allThreeDead()) { showGameOver(); stopStageAutoStart(); }

if (actor.id === 'Unique') {
  p.scale = (p.scale || 1) * 1.35;
  p.knockback = { force: 220, maxTargets: randInt(3,5), vsBoss: false };
  // Ensure homing component
  p.homing = p.homing || { enabled: true, turn: 0 };
  p.homing.enabled = true;
  p.homing.turn = 280 * (Math.PI/180); // store in rad/s if your engine expects radians
  // Add attack down status application on hit
  p.onHit = (t, origOnHit => function(target){
    if (origOnHit) origOnHit(target);
    if (target && !target.dead){
      applyStatus(target, 'atk_down', 5000); // 5s
      if (DMG_OVR) {
        const dmg = randInt(100,230);
        dealExtraDamage(target, dmg, { tag:'unique-basic-override' });
      }
    }
  })(t, p.onHit);
}

if (actor.id === 'A1') {
  // Replace gun with melee combo
  A1_playMeleeCombo(actor);
  return;
}

function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function dealExtraDamage(target, dmg, meta){ if(!target || target.dead) return;
  target.hp -= dmg;
  addFloater(target.x, target.y-40, dmg, '#ffda79');
  if (target.hp <= 0) killEnemy(target, meta);
}
function applyStatus(target, kind, ms){
  if(!target.status) target.status = [];
  target.status.push({ kind, until: performance.now()+ms });
}
