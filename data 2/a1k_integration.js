
// A1K Integration Shim — plugs the asset loader into an existing HTML game.
// Exposes helpers and mounts a small "quickbar" (Pet / Vehicle) UI.

(function(){
  window.A1K = window.A1K || {};
  const A = window.A1K;
  const log = (...a)=>console.log("[A1K Integrate]", ...a);

  // ---- Asset helpers
  A.assets = {
    get(cat, group, base){
      try {
        return (A.index?.[cat]?.[group]?.[base]) || null;
      } catch{ return null; }
    },
    require(cat, group, base){
      const p = A.assets.get(cat, group, base);
      if (!p) throw new Error(`Asset not found: ${cat}/${group}/${base}`);
      return p;
    },
    // Loose lookup: search by base-name across categories
    find(base){
      base = (base||"").toLowerCase();
      const hits = [];
      for (const cat of Object.keys(A.index||{})){
        for (const g of Object.keys(A.index[cat])){
          for (const k of Object.keys(A.index[cat][g])){
            if (k.toLowerCase().includes(base)){
              hits.push({cat, group:g, base:k, path:A.index[cat][g][k]});
            }
          }
        }
      }
      return hits;
    }
  };

  // ---- Event bridge for engines that prefer DOM events
  A.events = {
    emit(name, detail={}){
      document.dispatchEvent(new CustomEvent(name, {detail}));
    },
    on(name, fn){
      document.addEventListener(name, fn);
    }
  };

  // ---- Quickbar UI (non-invasive overlay). Emits A1K_CALL_PET / A1K_CALL_VEHICLE
  A.ui = {
    mountQuickbar(){
      if (document.getElementById("a1k-quickbar")) return;
      const bar = document.createElement("div");
      bar.id = "a1k-quickbar";
      bar.innerHTML = `
        <style>
          #a1k-quickbar{
            position:fixed; left:12px; bottom:128px; z-index:99999;
            display:flex; gap:8px; align-items:center;
            background:#0e1a2a; border:1px solid #293854; border-radius:14px;
            padding:8px 10px; box-shadow:0 6px 22px rgba(0,0,0,0.35);
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          }
          #a1k-quickbar .btn{
            min-width:72px; height:36px; border-radius:10px; border:1px solid #314867;
            background:#13243a; color:#cfe7ff; cursor:pointer; font-weight:700;
            letter-spacing:0.3px;
          }
          #a1k-quickbar .btn:active{ transform: translateY(1px); }
          #a1k-quickbar .led{ width:10px; height:10px; border-radius:50%; background:#3a536f; margin-left:6px; }
          #a1k-quickbar .led.on{ background:#66e0ff; box-shadow:0 0 10px #66e0ff; }
        </style>
        <button class="btn" id="btn-pet" title="Summon Pet (200 HP)">PET</button>
        <button class="btn" id="btn-veh" title="Call Vehicle & Embark">VEH</button>
        <div class="led" id="a1k-led"></div>
      `;
      document.body.appendChild(bar);
      const led = bar.querySelector("#a1k-led");

      bar.querySelector("#btn-pet").addEventListener("click", ()=>{
        A.events.emit("A1K_CALL_PET", { hp:200 });
        flash();
      });
      bar.querySelector("#btn-veh").addEventListener("click", ()=>{
        A.events.emit("A1K_CALL_VEHICLE", { enterAll:true });
        flash();
      });

      function flash(){ led.classList.add("on"); setTimeout(()=>led.classList.remove("on"), 250); }
    }
  };

  // Optional: bind an engine API (if your game exposes it)
  A.bindGame = function(gameApi){
    // Example shape (adapt to your engine):
    // gameApi.on(eventName, handler)
    // gameApi.spawn.pet({hp, assetPath})
    // gameApi.vehicle.enterAll(assetPath)

    A.events.on("A1K_CALL_PET", (e)=>{
      const { hp=200 } = e.detail||{};
      // Try to find a decent default pet sprite
      const hit = (A.assets.find("pet")[0] || A.assets.find("drone")[0] || A.assets.find("companion")[0]);
      const asset = hit ? hit.path : null;
      if (gameApi?.spawn?.pet){
        gameApi.spawn.pet({ hp, assetPath: asset });
      }
    });

    A.events.on("A1K_CALL_VEHICLE", (e)=>{
      // Find a vehicle sprite
      const hit = (A.assets.find("vehicle")[0] || A.assets.find("mech")[0] || A.assets.find("car")[0]);
      const asset = hit ? hit.path : null;
      if (gameApi?.vehicle?.enterAll){
        gameApi.vehicle.enterAll(asset);
      }
    });
  };

  // Boot behavior: once assets are ready, mount quickbar
  document.addEventListener("A1K_ASSETS_READY", ()=>{
    log("Assets ready; mounting quickbar & enabling helpers.");
    A.ui.mountQuickbar();
  });

  // ---- Inventory binding: <img data-a1k="cat:group:base">
  A.ui.bindDataImgs = function(){
    const nodes = document.querySelectorAll("[data-a1k]");
    nodes.forEach(el => {
      const tok = (el.getAttribute("data-a1k")||"").trim();
      if (!tok) return;
      const parts = tok.split(":");
      if (parts.length < 3) return;
      const [cat, group, base] = parts;
      try {
        const p = (A.index?.[cat]?.[group]?.[base]) || null;
        if (p) el.setAttribute("src", p);
      } catch {}
    });
  };
  document.addEventListener("A1K_ASSETS_READY", ()=>{
    try { A.ui.bindDataImgs(); } catch(e){}
  });

})();
