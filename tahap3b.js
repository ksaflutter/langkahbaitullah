// Tahap 3B-1: pengumuman beralarm dan SOS. Dimuat sebelum tahap3a.js
window.T3B=(()=>{
let inbox=null,sosVer='',sosData=[],uid='',ac=null,unlocked=false,beep=null,antri=[],lihat=new Set(),tickN=0;
const isStaf=()=>!!S.user&&['Admin','Team Leader','Muthawwif'].includes(S.user.role);
const isJam=()=>!!S.user&&S.user.role==='Jamaah';
const dg=h=>String(h||'').replace(/\D/g,'');

// ===== alarm (suara dibuat dari WebAudio, tanpa file) =====
function aktifkan(){
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ac.resume();unlocked=true;nada(880);toast('Alarm diaktifkan');fab();if($('pengPanel'))panel()}
  catch(e){toast('Perangkat ini tidak mendukung suara alarm.',false)}}
function nada(f){if(!ac||!unlocked)return;const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.value=.15;o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+.25)}
function bunyi(on){clearInterval(beep);beep=null;if(!on)return;let k=0;
  const f=()=>{nada(k++%2?660:880);if(navigator.vibrate)navigator.vibrate([300,150,300])};f();beep=setInterval(f,700);setTimeout(()=>{if(beep)bunyi(0)},60000)}

// ===== banner layar penuh (antrean) =====
function overlay(html){let o=$('alarmOv');
  if(!o){o=document.createElement('div');o.id='alarmOv';o.setAttribute('role','alertdialog');o.className='fixed inset-0 z-[60] bg-rose-700/95 text-white flex items-center justify-center p-5';document.body.appendChild(o)}
  o.innerHTML=`<div class="max-w-md w-full">${html}</div>`;o.classList.remove('hidden')}
const kosong=()=>{const o=$('alarmOv');return !o||o.classList.contains('hidden')};
function proses(){if(kosong()){const n=antri.shift();if(n)n()}}
function masuk(fn){antri.push(fn);proses()}
function tutupOv(){const o=$('alarmOv');if(o)o.classList.add('hidden');bunyi(0);proses()}

function showPeng(p){masuk(()=>{overlay(`<p class="text-sm font-bold opacity-80">Pengumuman penting dari ${esc(p.pengirim)}</p>
  <h2 class="text-2xl font-extrabold mt-1">${esc(p.judul)}</h2><p class="mt-3 whitespace-pre-line">${esc(p.isi)}</p>
  <button onclick="T3B.baca('${p.id}')" class="btn bg-white text-rose-700 w-full mt-6">Saya sudah baca</button>`);bunyi(1)})}
async function baca(id){await api('tandaiBaca',{ids:[id]});tutupOv();loadInbox()}

const tautan=s=>`${s.lat!=null?`<a class="underline" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${s.lat},${s.lng}">Lihat lokasi</a> · `:'<span class="opacity-70">lokasi tidak tersedia · </span>'}<a class="underline" target="_blank" rel="noopener" href="https://wa.me/${dg(s.hp)}">WhatsApp</a> · <a class="underline" href="tel:+${dg(s.hp)}">Telepon</a>`;
function showSOS(s){masuk(()=>{overlay(`<p class="text-sm font-bold opacity-80">SOS · ${esc(s.rombongan||'tanpa rombongan')} · ${esc(s.waktu)}</p>
  <h2 class="text-3xl font-extrabold mt-1">${esc(s.nama)}</h2><p class="mt-2">${esc(s.pesan)||'Butuh bantuan segera.'}</p><p class="mt-3 text-sm">${tautan(s)}</p>
  <div class="grid gap-2 mt-6"><button onclick="T3B.tangani('${s.id}')" class="btn bg-white text-rose-700">Saya tangani</button>
  <button onclick="T3B.tutupOv()" class="btn bg-rose-900 text-white">Tutup sementara</button></div>`);bunyi(1)})}
async function tangani(id){const j=await api('sosTangani',{id});toast(j.message,j.success);tutupOv();loadSOS()}

// ===== pemuatan data & denyut =====
async function loadSOS(){
  const j=await api('stafSOS');if(!j.success||!isStaf())return;
  sosVer=j.ver;sosData=j.sos;
  sosData.filter(s=>s.status==='Baru'&&!lihat.has(s.id)).forEach(s=>{lihat.add(s.id);showSOS(s)});
  fab()}
async function loadInbox(){
  const j=await api('jamaahInbox');if(!j.success||!isJam())return;
  const lama=new Set((inbox?inbox.pengumuman:[]).map(p=>p.id)),pertama=!inbox;
  inbox=j;
  j.pengumuman.filter(p=>!p.dibaca&&(pertama||!lama.has(p.id))).forEach(p=>{if(p.penting)showPeng(p);else if(!pertama)toast('Pengumuman baru: '+p.judul)});
  panel();
  const ids=j.pengumuman.filter(p=>!p.dibaca&&!p.penting).map(p=>p.id);
  if(ids.length&&$('pengPanel'))api('tandaiBaca',{ids})}
async function tick(){
  if(!S.user||document.hidden)return;tickN++;
  if(isStaf()){const r=await api('denyutStaf',{v:sosVer});if(r.success&&r.ubah)loadSOS()}
  else if(isJam()){
    if(inbox&&inbox.rid){const r=await api('denyutJamaah',{rid:inbox.rid,v:inbox.ver});if(r.success&&r.ubah)loadInbox()}
    else if(tickN%3===0)loadInbox()}}
setInterval(tick,20000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});

// ===== tombol melayang =====
function fab(){
  let a=$('alarmFab'),s=$('sosFab');
  if(!(isStaf()||isJam())){if(a)a.remove();if(s)s.remove();return}
  if(!s){s=document.createElement('button');s.id='sosFab';s.className='fixed left-4 bottom-5 z-20 rounded-full bg-rose-600 text-white shadow-lg font-extrabold px-4 h-14 min-w-[56px]';document.body.appendChild(s)}
  s.onclick=isJam()?sosForm:sosModal;
  const n=sosData.filter(x=>x.status==='Baru').length;
  s.textContent='🚨 SOS'+(isStaf()&&n?' ('+n+')':'');s.setAttribute('aria-label',isJam()?'Kirim SOS darurat':'Daftar SOS');
  if(!unlocked){if(!a){a=document.createElement('button');a.id='alarmFab';a.className='fixed left-4 bottom-24 z-20 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow font-bold text-xs px-3 h-10';a.onclick=aktifkan;document.body.appendChild(a)}a.textContent='🔔 Aktifkan alarm'}
  else if(a)a.remove()}

// ===== jamaah: panel pengumuman & SOS =====
function panel(){
  const b=$('jamaahBody');if(!b||!isJam())return;
  const lama=$('pengPanel');if(lama)lama.remove();
  if(!inbox){loadInbox();return}
  b.insertAdjacentHTML('afterbegin',`<section id="pengPanel" class="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
  <div class="flex items-center justify-between gap-2"><h3 class="font-bold text-navy">Pengumuman${inbox.rombongan?' · '+esc(inbox.rombongan):''}</h3>
  ${unlocked?'<span class="text-xs text-emerald-600">🔔 Alarm aktif</span>':'<button onclick="T3B.aktifkan()" class="btn !min-h-0 !py-1.5 bg-amber-100 text-amber-800">🔔 Aktifkan alarm</button>'}</div>
  <div class="mt-3 space-y-2">${inbox.pengumuman.slice(0,10).map(p=>`<div class="rounded-xl border ${p.penting?'border-rose-300 bg-rose-50':'border-slate-200'} p-3">
  <div class="flex justify-between gap-2"><b class="text-sm">${p.penting?'❗ ':''}${esc(p.judul)}</b><span class="text-[11px] text-slate-400 shrink-0">${esc(p.waktu)}</span></div>
  <p class="text-sm mt-1 whitespace-pre-line">${esc(p.isi)}</p><p class="text-[11px] text-slate-400 mt-1">${esc(p.pengirim)}</p></div>`).join('')||'<p class="text-xs text-slate-500">Belum ada pengumuman.</p>'}</div></section>`)}

function sosForm(){modal(`<h3 class="text-xl font-extrabold text-rose-600 pr-8">Kirim SOS</h3>
  <p class="text-sm text-slate-600 mt-1">Pesan darurat dan lokasi Anda akan dikirim ke Team Leader dan Muthawwif. Gunakan hanya saat benar-benar butuh bantuan.</p>
  <label class="block text-xs font-bold mt-3">Keterangan singkat (boleh dikosongkan)<textarea id="sos_p" rows="2" maxlength="200" class="inp mt-1" placeholder="Contoh: tersesat di dekat pintu 5"></textarea></label>
  <button onclick="T3B.kirimSOS(this)" class="btn bg-rose-600 text-white w-full mt-4">Kirim SOS sekarang</button>
  <p class="text-[11px] text-slate-500 mt-2">Browser akan meminta izin lokasi. Jika ditolak, SOS tetap terkirim tanpa lokasi.</p>`)}
async function kirimSOS(btn){await busy(btn,async()=>{
  const pos=await new Promise(ok=>{if(!navigator.geolocation)return ok(null);
    navigator.geolocation.getCurrentPosition(p=>ok(p.coords),()=>ok(null),{enableHighAccuracy:true,timeout:8000,maximumAge:30000})});
  const j=await api('jamaahSOS',{pesan:$('sos_p').value,lat:pos?pos.latitude:null,lng:pos?pos.longitude:null});
  toast(j.message,j.success);if(j.success)closeModal()})}

// ===== staf/admin: daftar SOS & pengumuman =====
function sosModal(){modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Permintaan SOS</h3><div class="space-y-2 mt-3">
  ${sosData.map(s=>`<div class="rounded-xl border ${s.status==='Baru'?'border-rose-400 bg-rose-50':'border-slate-200'} p-3"><div class="flex justify-between gap-2"><b class="text-sm">${esc(s.nama)}</b><span class="text-xs ${s.status==='Baru'?'text-rose-600 font-bold':'text-slate-500'}">${esc(s.status)}</span></div>
  <p class="text-xs text-slate-500">${esc(s.rombongan||'tanpa rombongan')} · ${esc(s.waktu)}${s.oleh?' · oleh '+esc(s.oleh):''}</p><p class="text-sm mt-1">${esc(s.pesan)||'-'}</p>
  <p class="text-xs mt-1 text-navy">${tautan(s).replace(/opacity-70/g,'text-slate-400')}</p>
  ${s.status==='Baru'?`<button onclick="T3B.tangani('${s.id}')" class="btn !min-h-0 !py-1.5 bg-emerald-600 text-white mt-2">Saya tangani</button>`:''}</div>`).join('')||'<p class="text-sm text-slate-500">Belum ada SOS dalam 24 jam terakhir.</p>'}</div>`)}

async function pengumuman(rid){
  modal('<p class="text-sm text-slate-500 py-6">Memuat pengumuman...</p>');
  const j=await api('daftarPengumuman',{rombonganId:rid});
  if(!j.success){modal(`<p class="text-sm text-rose-600 py-6">${esc(j.message)}</p>`);return}
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Pengumuman · ${esc(j.rombongan)}</h3>
  ${j.aktif?`<form onsubmit="T3B.kirim(event,'${rid}')" class="space-y-3 mt-3">
  <label class="block text-xs font-bold">Judul<input id="n_j" required maxlength="80" class="inp mt-1"></label>
  <label class="block text-xs font-bold">Pesan<textarea id="n_i" rows="3" required maxlength="1000" class="inp mt-1"></textarea></label>
  <label class="flex gap-2 text-sm"><input type="checkbox" id="n_p"> Penting: banner merah dan alarm di HP jamaah</label>
  <button class="btn bg-navy text-white w-full">Kirim ke ${j.total} jamaah</button></form>`:'<p class="text-xs text-slate-500 mt-2">Rombongan sudah selesai. Pengumuman baru tidak bisa dikirim.</p>'}
  <h4 class="font-bold text-sm mt-5 mb-2">Riwayat</h4><div class="space-y-2">${j.pengumuman.map(p=>`<div class="rounded-xl border ${p.penting?'border-rose-300 bg-rose-50':'border-slate-200'} p-3">
  <div class="flex justify-between gap-2"><b class="text-sm">${p.penting?'❗ ':''}${esc(p.judul)}</b><span class="text-[11px] text-slate-400">${esc(p.waktu)}</span></div>
  <p class="text-sm whitespace-pre-line">${esc(p.isi)}</p><p class="text-[11px] text-slate-500 mt-1">${esc(p.pengirim)} · dibaca ${p.sudah.length} dari ${j.total}</p>
  ${p.belum.length?`<details class="text-xs mt-1"><summary class="cursor-pointer text-slate-500">Belum membaca (${p.belum.length})</summary><p class="mt-1">${p.belum.map(esc).join(', ')}</p></details>`:''}</div>`).join('')||'<p class="text-xs text-slate-500">Belum ada pengumuman.</p>'}</div>`)}
async function kirim(e,rid){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('kirimPengumuman',{rombonganId:rid,judul:$('n_j').value,isi:$('n_i').value,penting:$('n_p').checked});
  toast(j.message,j.success);if(j.success)pengumuman(rid)})}

// dipanggil tiap render() dari tahap2.js: sesuaikan tombol & muat data saat pengguna berganti
function sync(){
  const id=S.user?S.user.userId:'';
  if(id!==uid){uid=id;inbox=null;sosData=[];sosVer='';lihat=new Set();antri=[];bunyi(0);const o=$('alarmOv');if(o)o.classList.add('hidden');
    if(id){if(isStaf())loadSOS();else if(isJam())loadInbox()}}
  fab()}

return{sync,panel,aktifkan,baca,tangani,tutupOv,sosForm,kirimSOS,sosModal,pengumuman,kirim};
})();
