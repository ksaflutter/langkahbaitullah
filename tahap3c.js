// Tahap 3B-2: checklist Nusuk dan absensi. Dimuat sebelum tahap3b.js
window.T3C=(()=>{
let seq=0,ab=null;
const WA=h=>'https://wa.me/'+String(h||'').replace(/\D/g,'');
const BD={Menunggu:'bg-amber-100 text-amber-800',Terverifikasi:'bg-emerald-100 text-emerald-700',Ditolak:'bg-rose-100 text-rose-700',Belum:'bg-slate-200 text-slate-600',Kosong:'bg-slate-100 text-slate-500'};
const LBL={Belum:'Melapor belum dapat',Kosong:'Belum ada bukti'};
const bdg=s=>`<span class="px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${BD[s]||'bg-slate-200'}">${esc(LBL[s]||s)}</span>`;
const muat=m=>modal(`<p class="text-sm text-slate-500 py-6">${m||'Memuat...'}</p>`);
const galat=m=>modal(`<p class="text-sm text-rose-600 py-6">${esc(m)}</p>`);

function kompres(file,max,q){return new Promise((ok,err)=>{const r=new FileReader();r.onload=e=>{const i=new Image();
  i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};
  i.onerror=()=>err(new Error('Foto tidak bisa dibaca. Coba foto lain.'));i.src=e.target.result};r.readAsDataURL(file)})}
async function jalan(btn,fn){await busy(btn,async()=>{try{await fn()}catch(e){toast(e.message,false)}})}

// ===== JAMAAH: kartu Nusuk =====
async function panel(){
  const n=++seq,j=await api('nusukStatus');
  if(n!==seq||!$('jamaahBody')||!j.success)return;
  const lama=$('nusukPanel');if(lama)lama.remove();
  let isi;
  if(!j.tersedia)isi='<p class="text-xs text-slate-500">🔒 Dibuka setelah Anda masuk rombongan.</p>';
  else if(j.status==='Terverifikasi')isi='<p class="text-sm text-emerald-700">✅ Kartu Nusuk Anda sudah terverifikasi.</p>';
  else if(j.status==='Menunggu')isi='<p class="text-sm text-amber-700">Bukti terkirim. Menunggu verifikasi Team Leader atau Muthawwif.</p>';
  else isi=`${j.status==='Ditolak'?`<p class="text-xs text-rose-600 mb-2">Ditolak: ${esc(j.catatan)}. Silakan unggah ulang.</p>`:''}
   ${j.status==='Belum'?'<p class="text-xs text-slate-500 mb-2">Laporan "belum dapat Nusuk" sudah dikirim ke Team Leader dan Muthawwif.</p>':''}
   <label class="block text-xs font-bold">Foto kartu atau tangkapan layar Nusuk<input type="file" accept="image/*" id="nus_f" class="inp mt-1"></label>
   <button onclick="T3C.kirim(this)" class="btn bg-navy text-white w-full mt-2">Kirim bukti Nusuk</button>
   ${j.status==='Belum'?'':'<button onclick="T3C.belum(this)" class="btn bg-slate-100 w-full mt-2">Saya belum dapat Nusuk</button>'}`;
  $('jamaahBody').insertAdjacentHTML('beforeend',`<section id="nusukPanel" class="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
  <div class="flex items-center justify-between gap-2"><h3 class="font-bold text-navy">Kartu Nusuk</h3>${j.tersedia&&j.status!=='Kosong'?bdg(j.status):''}</div><div class="mt-2">${isi}</div></section>`)}

async function kirim(btn){await jalan(btn,async()=>{
  const f=$('nus_f')&&$('nus_f').files[0];if(!f)throw new Error('Pilih atau ambil foto terlebih dahulu.');
  const b64=await kompres(f,1280,.7);toast('Mengunggah, mohon tunggu sebentar...');
  const j=await api('nusukUpload',{base64:b64,mimeType:'image/jpeg'});
  toast(j.message,j.success);if(j.success)panel()})}
async function belum(btn){
  if(!confirm('Kirim laporan bahwa Anda belum mendapat Nusuk ke Team Leader dan Muthawwif?'))return;
  await jalan(btn,async()=>{const j=await api('nusukBelum',{});toast(j.message,j.success);if(j.success)panel()})}

// ===== STAF/ADMIN: verifikasi Nusuk =====
async function nusuk(rid){
  muat('Memuat data Nusuk...');
  const j=await api('nusukDaftar',{rombonganId:rid});if(!j.success)return galat(j.message);
  const ord={Menunggu:0,Belum:1,Kosong:2,Ditolak:3,Terverifikasi:4};
  const list=[...j.anggota].sort((a,b)=>ord[a.status]-ord[b.status]);
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Nusuk · ${esc(j.rombongan)}</h3>
  <p class="text-sm mt-1"><b>${j.terverifikasi}</b> dari ${j.total} jamaah sudah terverifikasi.</p>
  <div class="mt-3 space-y-2">${list.map(a=>`<div class="rounded-xl border ${a.status==='Menunggu'?'border-amber-400':'border-slate-200'} p-3">
   <div class="flex items-center justify-between gap-2"><b class="text-sm">${esc(a.nama)}</b>${bdg(a.status)}</div>
   ${a.status==='Ditolak'&&a.catatan?`<p class="text-xs text-rose-600 mt-1">${esc(a.catatan)}</p>`:''}
   <div class="mt-2 flex flex-wrap gap-2 items-center">
   ${a.status==='Menunggu'?`<button onclick="T3C.lihat('${a.nusukId}','${rid}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Lihat</button>
    <button onclick="T3C.verif('${a.nusukId}','${rid}',true)" class="btn !min-h-0 !py-1.5 bg-emerald-600 text-white">Verifikasi</button>
    <button onclick="T3C.verif('${a.nusukId}','${rid}',false)" class="btn !min-h-0 !py-1.5 bg-rose-600 text-white">Tolak</button>`:''}
   ${a.status==='Belum'||a.status==='Kosong'||a.status==='Ditolak'?`<a href="${WA(a.hp)}" target="_blank" rel="noopener" class="btn !min-h-0 !py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center">💬 Hubungi</a>`:''}
   </div></div>`).join('')||'<p class="text-sm text-slate-500">Rombongan belum punya anggota.</p>'}</div>`)}
async function lihat(id,rid){
  toast('Membuka foto...');const j=await api('nusukLihat',{id});if(!j.success)return toast(j.message,false);
  modal(`<img src="${j.dataUrl}" class="w-full rounded-xl mt-6" alt="Bukti Nusuk"><button onclick="T3C.nusuk('${rid}')" class="btn bg-slate-200 w-full mt-3">Kembali</button>`)}
async function verif(id,rid,ok){
  let catatan='';
  if(!ok){catatan=prompt('Alasan penolakan (akan dibaca jamaah):');if(!catatan)return}
  toast('Memproses...');
  const j=await api('nusukVerif',{id,status:ok?'Terverifikasi':'Ditolak',catatan});
  toast(j.message,j.success);nusuk(rid)}

// ===== STAF/ADMIN: absensi =====
async function absen(rid){
  muat('Memuat sesi absensi...');
  const j=await api('absenDaftar',{rombonganId:rid});if(!j.success)return galat(j.message);
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Absensi · ${esc(j.rombongan)}</h3>
  ${j.aktif?`<form onsubmit="T3C.buat(event,'${rid}')" class="mt-3 flex gap-2"><input id="ab_j" required maxlength="80" class="inp" placeholder="Contoh: Kumpul bus 07.00"><button class="btn bg-navy text-white shrink-0">Buat sesi</button></form>`
   :'<p class="text-xs text-slate-500 mt-2">Rombongan sudah selesai. Sesi baru tidak bisa dibuat.</p>'}
  <div class="mt-4 space-y-2">${j.sesi.map(s=>`<button onclick="T3C.buka('${s.id}','${rid}')" class="w-full text-left rounded-xl border border-slate-200 p-3">
   <div class="flex justify-between gap-2"><b class="text-sm">${esc(s.judul)}</b><span class="text-xs text-slate-500 shrink-0">Hadir ${s.hadir}/${s.total}</span></div>
   <p class="text-[11px] text-slate-400">${esc(s.waktu)} · ${esc(s.oleh)}</p></button>`).join('')||'<p class="text-sm text-slate-500">Belum ada sesi absensi.</p>'}</div>`)}
async function buat(e,rid){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('absenBuat',{rombonganId:rid,judul:$('ab_j').value});
  toast(j.message,j.success);if(j.success)buka(j.sesiId,rid);})}

async function buka(sid,rid){
  muat('Memuat daftar jamaah...');
  const j=await api('absenDetail',{sesiId:sid});if(!j.success)return galat(j.message);
  ab={sid,rid,aktif:j.aktif,judul:j.sesi.judul,waktu:j.sesi.waktu,list:j.anggota};
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">${esc(ab.judul)}</h3><p class="text-[11px] text-slate-400">${esc(ab.waktu)}</p>
  <p id="abSum" class="text-sm mt-2"></p>
  ${ab.aktif?`<button onclick="T3C.semua()" class="btn !min-h-0 !py-1.5 bg-emerald-600 text-white mt-2">Tandai semua hadir</button>`:''}
  <div id="abList" class="mt-3 space-y-1"></div><button onclick="T3C.absen('${rid}')" class="btn bg-slate-200 w-full mt-4">Kembali</button>`);
  segar()}
function segar(){
  if(!ab||!$('abList'))return;
  const n=ab.list.length,h=ab.list.filter(x=>x.status==='Hadir').length,t=ab.list.filter(x=>x.status==='Tidak').length;
  $('abSum').innerHTML=`<b>Hadir ${h} dari ${n}</b> · Tidak hadir ${t} · Belum dicatat ${n-h-t}`;
  const tb=(x,s,kelas)=>`<button ${ab.aktif?'':'disabled'} onclick="T3C.set('${x.regId}','${s}')" class="btn !min-h-0 !py-1.5 ${x.status===s?kelas:'bg-slate-100'}">${s==='Hadir'?'Hadir':'Tidak'}</button>`;
  $('abList').innerHTML=ab.list.map(x=>`<div class="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5"><span class="text-sm">${esc(x.nama)}</span>
   <span class="flex gap-1 shrink-0">${tb(x,'Hadir','bg-emerald-600 text-white')}${tb(x,'Tidak','bg-rose-600 text-white')}</span></div>`).join('')||'<p class="text-sm text-slate-500">Rombongan belum punya anggota.</p>'}
async function simpanItems(items){
  const j=await api('absenSet',{sesiId:ab.sid,items});
  if(!j.success){toast(j.message,false);buka(ab.sid,ab.rid)}}
function set(regId,status){
  const x=ab.list.find(a=>a.regId===regId);if(!x||x.status===status)return;
  x.status=status;segar();simpanItems([{regId,status}])}
function semua(){
  const items=ab.list.filter(x=>x.status!=='Hadir').map(x=>({regId:x.regId,status:'Hadir'}));
  if(!items.length)return;
  ab.list.forEach(x=>x.status='Hadir');segar();simpanItems(items)}

return{panel,kirim,belum,nusuk,lihat,verif,absen,buat,buka,set,semua};
})();
