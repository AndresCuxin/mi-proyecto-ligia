/* =========================
   Utilidades de fecha/dinero
   ========================= */
function hoyISO(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function isoToDMY(iso){
  if(!iso) return '';
  const [y,m,d] = String(iso).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
function parseMoney(v){ return Number(String(v).replace(',','.')) || 0; }

/* =========================
   Menú (datos y render)
   ========================= */
let __MENU_CACHE = [];

async function loadMenu(){
  try{
    const res = await fetch('/api/menu');
    if(!res.ok) return;
    __MENU_CACHE = await res.json();
    renderMenu(__MENU_CACHE);
  }catch(_e){}
}

function renderMenu(items){
  const list = document.getElementById('menu-list');
  if(!list) return;
  list.innerHTML = '';
  for(const m of items){
    const row = document.createElement('button');
    row.className = 'menu-row';
    row.type = 'button';
    row.dataset.producto = m.producto;
    row.dataset.precio   = m.precio;
    row.innerHTML = `
      <img src="${m.img}" alt="${m.producto}" loading="lazy">
      <div class="meta">
        <h3>${m.producto}</h3>
        <span class="price">$${Number(m.precio).toFixed(2)}</span>
      </div>`;
    list.appendChild(row);
  }
}

function setupMenuFilter(){
  const input = document.getElementById('menu-filter');
  if(!input) return;
  input.addEventListener('input', ()=>{
    const q = input.value.toLowerCase().trim();
    if(!q) return renderMenu(__MENU_CACHE);
    renderMenu(__MENU_CACHE.filter(m => m.producto.toLowerCase().includes(q)));
  });
}

/* =========================
   Panel deslizable (PC + móvil)
   ========================= */
const menuBtn   = document.getElementById('menu-btn');
const slideMenu = document.getElementById('slide-menu');
const overlay   = document.getElementById('overlay');
const closeMenu = document.getElementById('close-menu');

function openMenu(){
  if(!slideMenu || !overlay) return;
  slideMenu.classList.add('open');
  overlay.classList.add('show');
  overlay.hidden = false;
  document.body.classList.add('menu-open');
}
function closeMenuFn(){
  if(!slideMenu || !overlay) return;
  slideMenu.classList.remove('open');
  overlay.classList.remove('show');
  document.body.classList.remove('menu-open');
  // espera al fade del overlay antes de ocultarlo del árbol
  setTimeout(()=>{ overlay.hidden = true; }, 280);
}

menuBtn?.addEventListener('click', openMenu);
closeMenu?.addEventListener('click', closeMenuFn);
overlay?.addEventListener('click', closeMenuFn);
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape' && slideMenu?.classList.contains('open')) closeMenuFn();
});

/* Click en un producto del menú → rellenar form y cerrar panel */
document.addEventListener('click', ev=>{
  const row = ev.target.closest('.menu-row');
  if(!row) return;
  const f = document.getElementById('f');
  if(!f) return;
  f.producto.value = row.dataset.producto || '';
  f.precio.value   = row.dataset.precio   || '';
  f.cantidad.value = 1;
  if(f.comentarios) f.comentarios.value = '';
  closeMenuFn();
  f.producto.focus();
});

/* =========================
   Listado, total y cambio
   ========================= */
async function load(){
  const r = await fetch('/api/registros');
  const { registros, total } = await r.json();
  const tb = document.querySelector('#t tbody');
  tb.innerHTML = '';

  registros.forEach((e, i) => {
    const numero = i + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="N.º">${numero}</td>
      <td data-label="Producto">${e.producto}</td>
      <td data-label="Precio">$${Number(e.precio).toFixed(2)}</td>
      <td data-label="Cant.">${e.cantidad}</td>
      <td data-label="Subt.">$${Number(e.subtotal).toFixed(2)}</td>
      <td data-label="Comentarios">${e.comentarios || '-'}</td>
      <td data-label="Fecha">${isoToDMY(e.fecha_venta)}</td>
      <td data-label="">
        <button class="btn-delete" data-id="${e.id}">Borrar</button>
      </td>`;
    tb.appendChild(tr);
  });

  document.getElementById('total').textContent = '$' + Number(total).toFixed(2);
  updateChange();
}

function updateChange(){
  const total = Number(document.getElementById('total').textContent.replace('$','')) || 0;
  const paga  = parseMoney(document.getElementById('paga').value);
  const cambio = Math.max(paga - total, 0);
  document.getElementById('cambio').textContent = '$' + cambio.toFixed(2);
}

/* =========================
   Eventos del formulario y acciones
   ========================= */
document.addEventListener('submit', async ev => {
  const form = ev.target;
  if(form.id !== 'f') return;
  ev.preventDefault();

  const fd = new FormData(form);
  let fv = (fd.get('fecha_venta') || '').trim();
  if(!fv) fv = hoyISO();
  fd.set('fecha_venta', fv);

  const res = await fetch('/api/registros', { method: 'POST', body: fd });
  if (res.ok) { form.reset(); load(); }
  else alert('Datos inválidos');
});

document.addEventListener('input', ev => {
  if (ev.target.id === 'paga') updateChange();
});

/* Eliminar con confirmación y blur (para no dejar focus) */
document.addEventListener('click', async ev => {
  const b = ev.target.closest('button[data-id]');
  if (!b) return;

  const fila = b.closest('tr');
  const producto = fila?.querySelector('[data-label="Producto"]')?.textContent || 'este registro';
  const ok = confirm(`🗑️ ¿Seguro que deseas borrar ${producto}?`);
  if (!ok) { b.blur(); return; }

  const res = await fetch(`/api/registros/${b.dataset.id}/delete`, { method: 'POST' });
  b.blur();
  if (res.ok) load();
});



/* ====== CLIENTE: seleccionar / quitar / enviar con el registro ====== */
let CURRENT_CLIENT = null;

function showClientBadge(cli){
  const badge = document.getElementById('client_badge');
  document.getElementById('client_name').textContent  = cli.nombre;
  document.getElementById('client_phone').textContent = cli.telefono;
  document.getElementById('cliente_id').value = cli.id;
  badge.hidden = false;
  CURRENT_CLIENT = cli;
}

function clearClient(){
  CURRENT_CLIENT = null;
  document.getElementById('cliente_id').value = '';
  document.getElementById('client_badge').hidden = true;
}

async function useClient(){
  const nombre = document.getElementById('cli_nombre').value.trim();
  const telefono = document.getElementById('cli_tel').value.trim();
  if(!nombre || !telefono){ alert('Escribe nombre y teléfono'); return; }

  const fd = new FormData();
  fd.append('nombre', nombre);
  fd.append('telefono', telefono);

  const res = await fetch('/api/clientes', { method:'POST', body: fd });
  const data = await res.json();
  if(!res.ok || !data.ok){ alert(data.error || 'No se pudo usar el cliente'); return; }
  showClientBadge(data.cliente);
}

document.getElementById('btn-usar-cliente')?.addEventListener('click', useClient);
document.getElementById('btn-quitar-cliente')?.addEventListener('click', clearClient);

/* Enviar cliente_id junto al registro al hacer submit del formulario principal */
document.addEventListener('submit', ev=>{
  const form = ev.target;
  if(form.id !== 'f') return;
  const cid = document.getElementById('cliente_id').value;
  if(cid){
    // Antes de enviar, agregamos cliente_id al FormData
    const fd = new FormData(form);
    fd.append('cliente_id', cid);
    ev.preventDefault();
    fetch('/api/registros', { method:'POST', body: fd })
      .then(r=>{ if(r.ok){ form.reset(); load(); } else return r.json().then(x=>{throw x;}); })
      .catch(e=> alert(e.error || 'Error al guardar'));
  }
});




/* =========================
   Arranque
   ========================= */
setupMenuFilter();
loadMenu();
load();
