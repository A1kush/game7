
// A1K HUD + Stats Panel + Hide logic
window.A1K = window.A1K || {};
A1K.state = A1K.state || { ui:{ hideTop:false, statsHidden:false }, saveVersion: 24 };

function qs(sel){ return document.querySelector(sel); }

A1K.anchorStatsUnderCluster = function(){
  const panel = qs('#squad-stats');
  if(!panel) return;
  const clusterSel = '#btnInventory, .btn-inventory, #btnSpeed, #btnSpeedX1, #btnPets';
  const node = document.querySelector(clusterSel);
  const b = node ? node.getBoundingClientRect() : {left:window.innerWidth-200, top:8, width:160, height:40, bottom:48};
  const pW = panel.offsetWidth || 260;
  const left = Math.round(b.left + (b.width - pW)/2);
  const top = Math.round(b.bottom + 6);
  panel.style.left = Math.max(8,left) + 'px';
  panel.style.top = Math.max(56, top) + 'px';
};

A1K.toggleStats = function(force){
  const el = qs('#squad-stats');
  if(!el) return;
  const hide = (force!==undefined) ? !force : !el.classList.contains('hidden');
  A1K.state.ui.statsHidden = hide;
  el.classList.toggle('hidden', hide);
  localStorage.setItem('a1k_state', JSON.stringify(A1K.state));
};

A1K.toggleTopHUD = function(force){
  const hud = qs('#topbar');
  if(!hud) return;
  const hide = (force!==undefined) ? !force : !hud.classList.contains('hidden');
  A1K.state.ui.hideTop = hide;
  hud.classList.toggle('hidden', hide);
  localStorage.setItem('a1k_state', JSON.stringify(A1K.state));
};

window.addEventListener('resize', A1K.anchorStatsUnderCluster);
window.addEventListener('orientationchange', A1K.anchorStatsUnderCluster);
window.addEventListener('load', ()=>{
  try{ A1K.state = JSON.parse(localStorage.getItem('a1k_state')) || A1K.state; }catch{}
  if(A1K.state.ui.hideTop) qs('#topbar')?.classList.add('hidden');
  if(A1K.state.ui.statsHidden) qs('#squad-stats')?.classList.add('hidden');
  A1K.anchorStatsUnderCluster();
});

// Render numbers (wire this to your character sheet updates)
A1K.renderSquadStats = function(a1,u,m){
  const id = s=>document.getElementById(s);
  id('a1-atk').textContent = a1.atk|0; id('a1-def').textContent = a1.def|0;
  id('u-atk').textContent  = u.atk|0;  id('u-def').textContent  = u.def|0;
  id('m-atk').textContent  = m.atk|0;  id('m-def').textContent  = m.def|0;
};
