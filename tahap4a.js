// Tahap 4A: Badal Umroh. Dimuat sebelum tahap3c.js
window.T4A=(()=>{
let seq=0,pesanan=[],layanan=[],adm={pesanan:[],pelaksana:[],layanan:[]};
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const WARNA={'Menunggu Pembayaran':'bg-slate-200 text-slate-600','Menunggu Verifikasi Bayar':'bg-amber-100 text-amber-800','Dibayar':'bg-sky-100 text-sky-700','Ditugaskan':'bg-sky-100 text-sky-700','Menunggu Verifikasi Bukti':'bg-amber-100 text-amber-800','Selesai':'bg-emerald-100 text-emerald-700'};
const bdg=s=>`<span class="px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${WARNA[s]||'bg-slate-200'}">${esc(s)}</span>`;
const muat=m=>modal(`<p class="text-sm text-slate-500 py-6">${m||'Memuat...'}</p>`);
const galat=m=>modal(`<p class="text-sm text-rose-600 py-6">${esc(m)}</p>`);
async function jalan(btn,fn){await busy(btn,async()=>{try{await fn()}catch(e){toast(e.message,false)}})}
function kompres(file,max,q){return new Promise((ok,err)=>{const r=new FileReader();r.onload=e=>{const i=new Image();
  i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};
  i.onerror=()=>err(new Error('Foto tidak bisa dibaca. Coba foto lain.'));i.src=e.target.result};r.readAsDataURL(file)})}
const bacaFile=f=>new Promise((ok,err)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>err(new Error('File tidak bisa dibaca.'));r.readAsDataURL(f)});
async function foto(id){const f=$(id)&&$(id).files[0];if(!f)throw new Error('Pilih atau ambil foto terlebih dahulu.');return kompres(f,1280,.7)}

// ===== beranda: tombol masuk pemesanan =====
function mulai(){
  if(!S.user){modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Pesan Badal Umroh</h3><p class="text-sm text-slate-600 mt-1 mb-4">Buat akun jamaah atau masuk terlebih dahulu agar Anda bisa memantau status pesanan dan mengunduh e-sertifikat.</p>
   <button onclick="showRegister('Jamaah')" class="btn bg-gold text-navy-dark w-full mb-2">Buat akun jamaah</button><button onclick="showLogin()" class="btn bg-slate-100 w-full">Saya sudah punya akun</button>`);return}
  if(S.user.role!=='Jamaah'){toast('Pemesanan badal memakai akun jamaah.',false);return}
  go('dash')}

// ===== PEMESAN (jamaah) =====
async function panel(){
  const n=++seq,j=await api('badalSaya');
  if(n!==seq||!$('jamaahBody')||!j.success)return;
  pesanan=j.pesanan;layanan=j.layanan;
  const lama=$('badalPanel');if(lama)lama.remove();
  const rek=S.cfg.info_rekening?`<p class="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2 whitespace-pre-line"><b>Transfer ke:</b>\n${esc(S.cfg.info_rekening)}</p>`:'';
  const kartu=o=>`<div class="rounded-xl border border-slate-200 p-3"><div class="flex justify-between gap-2"><b class="text-sm">${esc(o.layanan)}</b>${bdg(o.status)}</div>
   <p class="text-xs text-slate-500">${esc(o.id)} · atas nama <b>${esc(o.target)}</b> · ${rp(o.harga)}</p>
   ${o.status==='Menunggu Pembayaran'?`${o.catatan?`<p class="text-xs text-rose-600 mt-1">Ditolak: ${esc(o.catatan)}. Silakan unggah ulang.</p>`:''}${rek}
    <input type="file" accept="image/*" id="bb_${o.id}" class="inp mt-2"><button onclick="T4A.bayar('${o.id}',this)" class="btn bg-navy text-white w-full mt-2">Kirim bukti transfer</button>`:''}
   ${o.status==='Menunggu Verifikasi Bayar'?'<p class="text-xs text-amber-700 mt-1">Bukti terkirim. Menunggu verifikasi admin.</p>':''}
   ${o.status==='Dibayar'||o.status==='Ditugaskan'||o.status==='Menunggu Verifikasi Bukti'?'<p class="text-xs text-sky-700 mt-1">Pembayaran diterima. Badal sedang diproses oleh pelaksana di Makkah.</p>':''}
   ${o.status==='Selesai'?`<button onclick="T4A.sertifikat('${o.id}','j')" class="btn !min-h-0 !py-1.5 bg-gold text-navy-dark mt-2">📜 Lihat e-sertifikat</button>`:''}</div>`;
  $('jamaahBody').insertAdjacentHTML('beforeend',`<section id="badalPanel" class="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
  <div class="flex items-center justify-between gap-2"><h3 class="font-bold text-navy">Badal Umroh</h3><button onclick="T4A.form()" class="btn !min-h-0 !py-1.5 bg-gold text-navy-dark">+ Pesan badal</button></div>
  <div class="mt-3 space-y-2">${pesanan.map(kartu).join('')||'<p class="text-xs text-slate-500">Belum ada pesanan badal. Anda bisa memesan badal untuk orang tua, keluarga, atau yang berhalangan.</p>'}</div></section>`)}

function form(){
  if(!layanan.length)return toast('Layanan badal belum tersedia. Hubungi admin.',false);
  modal(`<h3 class="text-lg font-extrabold text-navy mb-1 pr-8">Pesan Badal Umroh</h3><p class="text-xs text-slate-500 mb-3">Dilaksanakan sesuai kaidah syariah oleh pelaksana di Makkah.</p>
  <form onsubmit="T4A.pesan(event)" class="space-y-3">
  <label class="block text-xs font-bold">Jenis layanan<select id="bd_l" class="inp mt-1">${layanan.map(l=>`<option value="${esc(l.id)}">${esc(l.nama)} · ${rp(l.harga)}</option>`).join('')}</select></label>
  <label class="block text-xs font-bold">Nama yang dibadalkan (almarhum/almarhumah atau yang berhalangan)<input id="bd_t" class="inp mt-1" required maxlength="100"></label>
  <button class="btn bg-navy text-white w-full">Buat pesanan</button></form>`)}
async function pesan(e){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('badalPesan',{layananId:$('bd_l').value,target:$('bd_t').value});
  toast(j.message,j.success);if(j.success){closeModal();panel()}})}
async function bayar(id,btn){await jalan(btn,async()=>{
  const b64=await foto('bb_'+id);toast('Mengunggah, mohon tunggu sebentar...');
  const j=await api('badalBayar',{id,base64:b64,mimeType:'image/jpeg'});
  toast(j.message,j.success);if(j.success)panel()})}

// ===== PELAKSANA BADAL =====
async function pelaksana(){
  const b=$('badalBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat tugas...</p>';
  const j=await api('badalTugas');if(!$('badalBody'))return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  gambarTugas(j)}
function gambarTugas(j){
  const b=$('badalBody');if(!b)return;
  const ck=ok=>ok?'✅':'⬜';
  b.innerHTML=j.tugas.map(o=>`<section class="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
  <div class="flex justify-between gap-2"><h3 class="font-bold text-navy">${esc(o.layanan)}</h3>${bdg(o.status)}</div>
  <p class="text-sm mt-1">Atas nama: <b>${esc(o.target)}</b></p><p class="text-xs text-slate-500">${esc(o.id)} · pemesan ${esc(o.pemesan)}</p>
  ${o.catatan?`<p class="text-xs text-rose-600 mt-2">Ditolak admin: ${esc(o.catatan)}. Silakan unggah ulang.</p>`:''}
  ${o.status==='Ditugaskan'?`<div class="mt-3 space-y-4">
   <div><p class="text-sm font-bold">${ck(o.adaFoto)} Bukti foto</p><input type="file" accept="image/*" id="tf_${o.id}" class="inp mt-1"><button onclick="T4A.unggah('${o.id}','foto',this)" class="btn bg-navy text-white w-full mt-2">Unggah foto</button></div>
   <div><p class="text-sm font-bold">${ck(o.adaVideo)} Bukti video</p><input type="file" accept="video/*" id="tv_${o.id}" class="inp mt-1"><p class="text-[11px] text-slate-500 mt-1">Maksimal ${j.maxVideoMB} MB. Rekam singkat (sekitar 30 detik, kualitas 720p).</p>
    <button onclick="T4A.unggah('${o.id}','video',this)" class="btn bg-navy text-white w-full mt-2">Unggah video</button>
    <p class="text-xs text-slate-500 mt-3">Video terlalu besar? Unggah ke Google Drive atau YouTube (tidak publik), lalu tempel linknya:</p>
    <input id="tl_${o.id}" class="inp mt-1" placeholder="https://..."><button onclick="T4A.unggah('${o.id}','link',this)" class="btn bg-slate-200 w-full mt-2">Simpan link video</button></div></div>`:''}
  ${o.status==='Menunggu Verifikasi Bukti'?'<p class="text-sm text-amber-700 mt-3">Foto dan video lengkap. Menunggu verifikasi admin.</p>':''}
  ${o.status==='Selesai'?'<p class="text-sm text-emerald-700 mt-3">✅ Selesai dan telah diverifikasi.</p>':''}</section>`).join('')
  ||'<p class="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-5">Belum ada tugas badal untuk Anda. Admin akan menugaskan setelah pembayaran pemesan diverifikasi.</p>'}
async function unggah(id,jenis,btn){await jalan(btn,async()=>{
  let data={id,jenis};
  if(jenis==='foto'){data.base64=await foto('tf_'+id);data.mimeType='image/jpeg'}
  else if(jenis==='video'){
    const f=$('tv_'+id).files[0];if(!f)throw new Error('Pilih atau rekam video terlebih dahulu.');
    toast('Membaca video...');data.base64=await bacaFile(f);data.mimeType=f.type||'video/mp4'}
  else{data.link=$('tl_'+id).value.trim();if(!data.link)throw new Error('Tempel link video terlebih dahulu.')}
  toast(jenis==='video'?'Mengunggah video, bisa beberapa menit. Jangan tutup halaman...':'Mengunggah...');
  const j=await api('badalUploadBukti',data);
  toast(j.message,j.success);if(j.success)gambarTugas(j)})}

// ===== ADMIN =====
const URUT={'Menunggu Verifikasi Bayar':0,'Menunggu Verifikasi Bukti':1,'Dibayar':2,'Ditugaskan':3,'Menunggu Pembayaran':4,'Selesai':5};
async function muatAdm(){const j=await api('adminBadalDaftar');if(j.success)adm=j;return j}
async function admin(){
  const b=$('adminBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat pesanan badal...</p>';
  const j=await muatAdm();if(!$('adminBody')||S.tab!=='badal')return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  daftar()}
function daftar(){
  const b=$('adminBody');if(!b||S.tab!=='badal')return;
  const list=[...adm.pesanan].sort((a,c)=>URUT[a.status]-URUT[c.status]);
  b.innerHTML=`<button onclick="T4A.layananAdm()" class="btn bg-slate-200 mb-3">Kelola layanan dan harga</button><div class="space-y-2">
  ${list.map(o=>`<button onclick="T4A.buka('${o.id}')" class="w-full text-left bg-white border ${URUT[o.status]<=2?'border-amber-400':'border-slate-200'} rounded-xl p-3">
  <div class="flex justify-between gap-2"><b class="text-sm">${esc(o.layanan)}</b>${bdg(o.status)}</div>
  <p class="text-xs text-slate-500">${esc(o.id)} · ${esc(o.target)} · pemesan ${esc(o.pemesan)} · ${rp(o.harga)}</p>
  ${o.pelaksana?`<p class="text-xs">Pelaksana: ${esc(o.pelaksana)}</p>`:''}</button>`).join('')||'<p class="text-sm text-slate-500">Belum ada pesanan badal.</p>'}</div>`}

function buka(id){
  const o=adm.pesanan.find(x=>x.id===id);if(!o)return;
  const tugas=['Dibayar','Ditugaskan'].includes(o.status)&&!o.adaFoto&&!o.adaVideo;
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">${esc(o.layanan)}</h3><div class="flex gap-2 items-center mt-1">${bdg(o.status)}<span class="text-xs text-slate-500">${esc(o.id)}</span></div>
  <p class="text-sm mt-3">Atas nama: <b>${esc(o.target)}</b></p><p class="text-xs text-slate-500">Pemesan: ${esc(o.pemesan)} · ${esc(o.noWa)} · ${rp(o.harga)}</p>
  ${o.pelaksana?`<p class="text-xs text-slate-500">Pelaksana: ${esc(o.pelaksana)}</p>`:''}${o.catatan?`<p class="text-xs text-rose-600 mt-1">Catatan: ${esc(o.catatan)}</p>`:''}
  <div class="grid gap-2 mt-4">
  ${o.status==='Menunggu Verifikasi Bayar'?`<button onclick="T4A.lihat('${o.id}','bayar')" class="btn bg-slate-200">Lihat bukti transfer</button>
   <button onclick="T4A.verifBayar('${o.id}',true)" class="btn bg-emerald-600 text-white">Verifikasi pembayaran</button><button onclick="T4A.verifBayar('${o.id}',false)" class="btn bg-rose-600 text-white">Tolak pembayaran</button>`:''}
  ${tugas?`<label class="block text-xs font-bold">Tugaskan pelaksana<select id="ad_p" class="inp mt-1"><option value="">Pilih pelaksana</option>${adm.pelaksana.map(p=>`<option value="${esc(p.id)}" ${p.id===o.pelaksanaId?'selected':''}>${esc(p.nama)}</option>`).join('')}</select></label>
   <button onclick="T4A.tugaskan('${o.id}',this)" class="btn bg-navy text-white">Tugaskan</button>${adm.pelaksana.length?'':'<p class="text-xs text-slate-500">Belum ada akun Pelaksana Badal yang disetujui.</p>'}`:''}
  ${o.status==='Menunggu Verifikasi Bukti'?`<button onclick="T4A.lihat('${o.id}','foto')" class="btn bg-slate-200">Lihat foto bukti</button><button onclick="T4A.lihat('${o.id}','video')" class="btn bg-slate-200">Buka video bukti</button>
   <button onclick="T4A.verifBukti('${o.id}',true)" class="btn bg-emerald-600 text-white">Setujui dan selesaikan</button><button onclick="T4A.verifBukti('${o.id}',false)" class="btn bg-rose-600 text-white">Tolak bukti</button>`:''}
  ${o.status==='Selesai'?`<button onclick="T4A.sertifikat('${o.id}','a')" class="btn bg-gold text-navy-dark">📜 Lihat e-sertifikat</button><button onclick="T4A.lihat('${o.id}','foto')" class="btn bg-slate-200">Lihat foto bukti</button><button onclick="T4A.lihat('${o.id}','video')" class="btn bg-slate-200">Buka video bukti</button>`:''}
  </div>`)}

async function lihat(id,jenis){
  toast('Membuka...');const j=await api('adminBadalLihat',{id,jenis});if(!j.success)return toast(j.message,false);
  if(j.url){window.open(j.url,'_blank','noopener');return}
  modal(`<img src="${j.dataUrl}" class="w-full rounded-xl mt-6" alt="Bukti"><button onclick="T4A.buka('${id}')" class="btn bg-slate-200 w-full mt-3">Kembali</button>`)}
async function setelah(j,id){toast(j.message,j.success);if(j.success){await muatAdm();daftar();buka(id)}}
async function verifBayar(id,ok){
  let catatan='';if(!ok){catatan=prompt('Alasan penolakan (akan dibaca pemesan):');if(!catatan)return}
  toast('Memproses...');setelah(await api('adminBadalVerifBayar',{id,ok,catatan}),id)}
async function verifBukti(id,ok){
  let catatan='';if(!ok){catatan=prompt('Alasan penolakan (akan dibaca pelaksana):');if(!catatan)return}
  toast('Memproses...');setelah(await api('adminBadalVerifBukti',{id,ok,catatan}),id)}
async function tugaskan(id,btn){await jalan(btn,async()=>{
  const p=$('ad_p').value;if(!p)throw new Error('Pilih pelaksana terlebih dahulu.');
  setelah(await api('adminBadalTugaskan',{id,pelaksanaId:p}),id)})}

function layananAdm(){
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Layanan dan harga badal</h3><div class="mt-3 space-y-2">
  ${adm.layanan.map(l=>`<div class="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"><div><b class="text-sm">${esc(l.nama)}</b><p class="text-xs text-slate-500">${rp(l.harga)} · ${esc(l.status)}</p></div>
  <button onclick="T4A.lForm('${l.id}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Ubah</button></div>`).join('')}</div>
  <button onclick="T4A.lForm()" class="btn bg-gold text-navy-dark w-full mt-3">+ Tambah layanan</button>`)}
function lForm(id){
  const l=adm.layanan.find(x=>x.id===id)||{status:'Aktif'};
  modal(`<h3 class="text-lg font-extrabold text-navy mb-3 pr-8">${id?'Ubah layanan':'Tambah layanan'}</h3><form onsubmit="T4A.lSimpan(event,'${id||''}')" class="space-y-3">
  <label class="block text-xs font-bold">Nama layanan<input id="ly_n" class="inp mt-1" required value="${esc(l.nama||'')}"></label>
  <label class="block text-xs font-bold">Harga (Rp)<input id="ly_h" type="number" min="1" class="inp mt-1" required value="${l.harga||''}"></label>
  <label class="block text-xs font-bold">Status<select id="ly_s" class="inp mt-1"><option ${l.status==='Aktif'?'selected':''}>Aktif</option><option ${l.status==='Nonaktif'?'selected':''}>Nonaktif</option></select></label>
  <button class="btn bg-navy text-white w-full">Simpan</button></form>`)}
async function lSimpan(e,id){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('adminSimpanLayanan',{id,nama:$('ly_n').value,harga:$('ly_h').value,status:$('ly_s').value});
  toast(j.message,j.success);if(j.success){await muatAdm();layananAdm()}})}

// ===== E-SERTIFIKAT (digambar di HP, tanpa server) =====
async function sertifikat(id,dari){
  const o=(dari==='a'?adm.pesanan:pesanan).find(x=>x.id===id);if(!o)return;
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">E-Sertifikat Badal Umroh</h3><div class="mt-3 border border-gold rounded-xl p-1 bg-slate-100"><canvas id="certC" width="1000" height="700" class="w-full h-auto rounded-lg"></canvas></div>
  <button onclick="T4A.unduh('${o.id}')" class="btn bg-navy text-white w-full mt-3">Unduh sertifikat (PNG)</button>`);
  try{await Promise.all([document.fonts.load('bold 30px "Plus Jakarta Sans"'),document.fonts.load('bold 34px Amiri')])}catch(e){}
  gambar($('certC'),o)}
function gambar(cv,o){
  if(!cv)return;const x=cv.getContext('2d'),W=1000,H=700,c=S.cfg.nama_app||'Langkah Baitullah';
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  x.strokeStyle='#D4AF37';x.lineWidth=14;x.strokeRect(24,24,W-48,H-48);x.strokeStyle='#1E3A8A';x.lineWidth=3;x.strokeRect(44,44,W-88,H-88);
  x.textAlign='center';
  x.fillStyle='#1E3A8A';x.font='bold 40px "Plus Jakarta Sans",sans-serif';x.fillText('SERTIFIKAT BADAL UMROH',W/2,130);
  x.fillStyle='#D4AF37';x.font='bold 20px "Plus Jakarta Sans",sans-serif';x.fillText(c.toUpperCase(),W/2,168);
  x.fillStyle='#1E3A8A';x.font='bold 34px Amiri,serif';x.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',W/2,235);
  x.fillStyle='#475569';x.font='20px "Plus Jakarta Sans",sans-serif';x.fillText('Menyatakan bahwa ibadah '+o.layanan+' atas nama:',W/2,295);
  x.fillStyle='#A8872A';x.font='bold 44px "Plus Jakarta Sans",sans-serif';x.fillText(o.target,W/2,365,W-160);
  x.fillStyle='#475569';x.font='20px "Plus Jakarta Sans",sans-serif';
  x.fillText('telah dilaksanakan di Kota Suci Makkah Al-Mukarramah',W/2,425);
  x.fillText('Pelaksana: '+(o.pelaksana||'-'),W/2,465);x.fillText('Pemesan: '+o.pemesan,W/2,500);
  x.font='bold 16px "Plus Jakarta Sans",sans-serif';x.fillStyle='#1E3A8A';x.fillText('Selesai pada '+(o.selesai||'-'),W/2,570);
  x.font='14px "Plus Jakarta Sans",sans-serif';x.fillStyle='#64748b';x.fillText('Kode verifikasi: '+o.id,W/2,610)}
function unduh(id){
  const cv=$('certC');if(!cv)return;
  const a=document.createElement('a');a.download='Sertifikat-Badal-'+id+'.png';a.href=cv.toDataURL('image/png');a.click()}

return{mulai,panel,form,pesan,bayar,pelaksana,unggah,admin,buka,lihat,verifBayar,verifBukti,tugaskan,layananAdm,lForm,lSimpan,sertifikat,unduh};
})();
