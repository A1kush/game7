export function bindUI(){
  const inv = document.getElementById('inventory');
  const shop = document.getElementById('shop');
  const settings = document.getElementById('settings');
  const q = (sel) => document.querySelector(sel);
  q('#btnInventory')?.addEventListener('click', () => {
    inv.style.display = (inv.style.display==='none' || !inv.style.display) ? 'flex' : 'none';
  });
  q('#btnShop')?.addEventListener('click', () => {
    shop.style.display = (shop.style.display==='none' || !shop.style.display) ? 'block' : 'none';
  });
  q('#btnSettings')?.addEventListener('click', () => {
    settings.style.display = (settings.style.display==='none' || !settings.style.display) ? 'block' : 'none';
  });
}