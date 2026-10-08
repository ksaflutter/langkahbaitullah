// Tahap 3A: rombongan, Team Leader, Muthawwif, kamar hotel. Dimuat sebelum tahap2.js
window.T3=(()=>{
const WA=h=>'https://wa.me/'+String(h||'').replace(/\D/g,'');
const cache={};let opt={paket:[],tl:[],mut:[],jamaah:[]},adm=[],stafList=[],seq=0;
const nm=(r,ids)=>ids.map(i=>(r.anggota.find(a=>a.regId===i)||{}).nama||i).join(', ');
const bdgT=t=>`<span class="px-2 py-0.5 rounded-full text-[11px] font-bold ${t==='Lengkap'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-800'}">${esc(t)}</span>`;
const kontak=x=>x?`<a href="${WA(x.noWa)}" target="_blank" rel="noopener" class="underline text-navy">${esc(x.nama)}</a>`:'<span class="text-slate-400">belum ditentukan</span>';
const kamarCard=(k,names)=>`<div class="rounded-xl border border-slate-200 bg-white p-3 text-sm"><b>${esc(k.hotel)}</b> <span class="text-xs text-slate-500">· ${esc(k.kota)}</span>
  <p class="text-xs text-slate-500">${esc(k.alamat)}</p><p class="mt-1">Kamar <b>${esc(k.noKamar)}</b></p><p class="text-xs text-slate-600">${esc(names)}</p></div>`;
const lbl=(t,inner)=>`<label class="block text-xs font-bold">${t}${inner}</label>`;

// ===== ADMIN: rombongan =====
async function muatAdmin(){const j=await api('adminRombongan');if(j.success){opt=j;adm=j.rombongan;adm.forEach(r=>cache[r.id]=r)}return j}
async function admin(){
  const b=$('adminBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat rombongan...</p>';
  const j=await muatAdmin();if(!$('adminBody')||S.tab!=='rom')return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  draw()}
function draw(){
  const b=$('adminBody');if(!b||S.tab!=='rom')return;
  b.innerHTML=`<button onclick="T3.form()" class="btn bg-gold text-navy-dark mb-3">+ Buat rombongan</button><div class="space-y-2">
  ${[...adm].sort((a,b)=>(a.status==='Selesai')-(b.status==='Selesai')).map(r=>`<button onclick="T3.buka('${r.id}')" class="w-full text-left bg-white border border-slate-200 rounded-xl p-3">
  <div class="flex justify-between gap-2"><b class="text-sm">${esc(r.nama)}</b><span class="text-xs text-slate-500">${esc(r.status)}</span></div>
  <p class="text-xs text-slate-500">${esc(r.paket)} · ${esc(r.tgl)} · ${r.anggota.length} jamaah</p>
  <p class="text-xs">TL: ${r.tl?esc(r.tl.nama):'-'} · Muthawwif: ${r.mut?esc(r.mut.nama):'-'}</p></button>`).join('')||'<p class="text-sm text-slate-500">Belum ada rombongan. Klik Buat rombongan.</p>'}</div>`}

function buka(id){
  const r=cache[id];if(!r)return;
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">${esc(r.nama)}</h3><p class="text-xs text-slate-500 mb-3">${esc(r.paket)} · ${esc(r.tgl)} · ${esc(r.status)}</p>
  <p class="text-sm">Team Leader: ${kontak(r.tl)}<br>Muthawwif: ${kontak(r.mut)}</p>
  <div class="grid gap-2 mt-4"><button onclick="T3.anggota('${id}')" class="btn bg-navy text-white">Atur anggota (${r.anggota.length})</button>
  <button onclick="T3.kamarModal('${id}')" class="btn bg-gold text-navy-dark">Kamar hotel (${r.kamar.length})</button>
  <button onclick="T3B.pengumuman('${id}')" class="btn bg-slate-200">Pengumuman dan tanda baca</button>
  <button onclick="T3.form('${id}')" class="btn bg-slate-200">Ubah data rombongan</button></div>`)}

function form(id){
  const r=cache[id]||{status:'Aktif'};
  const o=(arr,v)=>arr.map(x=>`<option value="${esc(x.id)}" ${x.id===v?'selected':''}>${esc(x.nama)}</option>`).join('');
  modal(`<h3 class="text-lg font-extrabold text-navy mb-3">${id?'Ubah rombongan':'Buat rombongan'}</h3><form onsubmit="T3.simpan(event,'${id||''}')" class="space-y-3">
  ${lbl('Nama rombongan',`<input id="r_nama" class="inp mt-1" required value="${esc(r.nama||'')}">`)}
  ${lbl('Paket',`<select id="r_paket" class="inp mt-1" ${id?'disabled':'required'}>${id?'':'<option value="">Pilih paket</option>'}${opt.paket.map(p=>`<option value="${esc(p.id)}" ${p.id===r.paketId?'selected':''}>${esc(p.nama)} (${esc(p.tgl)})</option>`).join('')}</select>`)}
  ${lbl('Team Leader',`<select id="r_tl" class="inp mt-1"><option value="">Belum ditentukan</option>${o(opt.tl,r.tlId)}</select>`)}
  ${lbl('Muthawwif',`<select id="r_mut" class="inp mt-1"><option value="">Belum ditentukan</option>${o(opt.mut,r.mutId)}</select>`)}
  ${lbl('Status',`<select id="r_st" class="inp mt-1"><option ${r.status==='Aktif'?'selected':''}>Aktif</option><option ${r.status==='Selesai'?'selected':''}>Selesai</option></select>`)}
  <p class="text-[11px] text-slate-500">Hanya akun Team Leader dan Muthawwif yang sudah disetujui yang muncul di daftar.</p>
  <button class="btn bg-navy text-white w-full">Simpan</button></form>`)}
async function simpan(e,id){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('adminSimpanRombongan',{id,nama:$('r_nama').value,paketId:$('r_paket').value,tlId:$('r_tl').value,mutId:$('r_mut').value,status:$('r_st').value});
  toast(j.message,j.success);if(j.success){closeModal();await muatAdmin();draw()}})}

function anggota(id){
  const r=cache[id],list=opt.jamaah.filter(x=>x.paketId===r.paketId);
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Anggota ${esc(r.nama)}</h3><p class="text-xs text-slate-500 mb-3">Hanya jamaah satu paket dengan pembayaran sudah terverifikasi.</p>
  <div class="space-y-1">${list.map(x=>{const lain=x.rombonganId&&x.rombonganId!==id;
   return `<label class="flex items-center gap-2 text-sm rounded-lg border border-slate-200 p-2 ${lain?'opacity-50':''}"><input type="checkbox" class="a_cb" value="${esc(x.regId)}" ${x.rombonganId===id?'checked':''} ${lain?'disabled':''}>
   <span>${esc(x.nama)} <span class="text-xs text-slate-500">${esc(x.tipe)} · ${esc(x.regId)}${lain?' · sudah di rombongan lain':''}</span></span></label>`}).join('')||'<p class="text-sm text-slate-500">Belum ada jamaah yang memenuhi syarat.</p>'}</div>
  <button onclick="T3.simpanAnggota('${id}',this)" class="btn bg-navy text-white w-full mt-4">Simpan anggota</button>
  <button onclick="T3.buka('${id}')" class="btn bg-slate-200 w-full mt-2">Kembali</button>`)}
async function simpanAnggota(id,btn){await busy(btn,async()=>{
  const ids=[...document.querySelectorAll('.a_cb:checked')].map(x=>x.value);
  const j=await api('adminSetAnggota',{rombonganId:id,regIds:ids});
  toast(j.message,j.success);if(j.success){await muatAdmin();buka(id)}})}

// ===== KAMAR (admin & Team Leader) =====
const muatUlang=()=>S.user.role==='Admin'?muatAdmin():muatStaf();
function kamarModal(id){
  const r=cache[id];if(!r)return;
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">Kamar · ${esc(r.nama)}</h3><div class="space-y-2 mt-3">
  ${r.kamar.map(k=>`${kamarCard(k,nm(r,k.penghuni))}<div class="flex gap-2 -mt-1 mb-2"><button onclick="T3.kForm('${id}','${k.id}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Ubah</button>
  <button onclick="T3.kHapus('${id}','${k.id}')" class="btn !min-h-0 !py-1.5 bg-rose-600 text-white">Hapus</button></div>`).join('')||'<p class="text-sm text-slate-500">Belum ada kamar.</p>'}</div>
  <button onclick="T3.kForm('${id}')" class="btn bg-gold text-navy-dark w-full mt-2" ${r.anggota.length?'':'disabled'}>+ Tambah kamar</button>
  ${r.anggota.length?'':'<p class="text-xs text-slate-500 mt-1">Rombongan belum punya anggota.</p>'}
  ${S.user.role==='Admin'?`<button onclick="T3.buka('${id}')" class="btn bg-slate-200 w-full mt-2">Kembali</button>`:''}`)}
function kForm(id,kid){
  const r=cache[id],k=r.kamar.find(x=>x.id===kid)||{kota:'Makkah',penghuni:[]};
  modal(`<h3 class="text-lg font-extrabold text-navy mb-3 pr-8">${kid?'Ubah kamar':'Tambah kamar'}</h3><form onsubmit="T3.kSimpan(event,'${id}','${kid||''}')" class="space-y-3">
  ${lbl('Kota',`<select id="k_kota" class="inp mt-1"><option ${k.kota==='Makkah'?'selected':''}>Makkah</option><option ${k.kota==='Madinah'?'selected':''}>Madinah</option></select>`)}
  ${lbl('Nama hotel',`<input id="k_hotel" class="inp mt-1" required value="${esc(k.hotel||'')}">`)}
  ${lbl('Alamat hotel',`<input id="k_alamat" class="inp mt-1" required value="${esc(k.alamat||'')}">`)}
  ${lbl('Nomor kamar',`<input id="k_no" class="inp mt-1" required value="${esc(k.noKamar||'')}">`)}
  <fieldset><legend class="text-xs font-bold mb-1">Penghuni (maksimal 4)</legend><div class="space-y-1">
  ${r.anggota.map(a=>`<label class="flex items-center gap-2 text-sm rounded-lg border border-slate-200 p-2"><input type="checkbox" class="k_cb" value="${esc(a.regId)}" ${k.penghuni.includes(a.regId)?'checked':''}> ${esc(a.nama)} <span class="text-xs text-slate-500">${esc(a.tipe)}</span></label>`).join('')}</div></fieldset>
  <button class="btn bg-navy text-white w-full">Simpan kamar</button></form>`)}
async function kSimpan(e,id,kid){e.preventDefault();await busy(e.submitter,async()=>{
  const j=await api('simpanKamar',{rombonganId:id,kamarId:kid,kota:$('k_kota').value,hotel:$('k_hotel').value,alamat:$('k_alamat').value,noKamar:$('k_no').value,
    penghuni:[...document.querySelectorAll('.k_cb:checked')].map(x=>x.value)});
  toast(j.message,j.success);if(j.success){await muatUlang();drawStaf();kamarModal(id)}})}
async function kHapus(id,kid){
  if(!confirm('Hapus kamar ini?'))return;
  const j=await api('hapusKamar',{kamarId:kid});toast(j.message,j.success);
  if(j.success){await muatUlang();drawStaf();kamarModal(id)}}

// ===== TEAM LEADER & MUTHAWWIF =====
async function muatStaf(){const j=await api('stafRombongan');if(j.success){stafList=j.rombongan;stafList.forEach(r=>cache[r.id]=r)}return j}
async function staf(){
  const b=$('stafBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat rombongan...</p>';
  const j=await muatStaf();if(!$('stafBody'))return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  drawStaf()}
const kartuStaf=(r,tl)=>`<section class="bg-white rounded-2xl border border-slate-200 p-5 mb-4"><div class="flex items-start justify-between gap-2"><div><h3 class="font-bold text-navy">${esc(r.nama)}</h3>
  <p class="text-xs text-slate-500">${esc(r.paket)} · berangkat ${esc(r.tgl)} · ${r.anggota.length} jamaah</p></div>
  ${r.status==='Selesai'?'':`<button onclick="T3B.pengumuman('${r.id}')" class="btn !min-h-0 !py-1.5 bg-navy text-white shrink-0">📣 Pengumuman</button>`}</div>
  <p class="text-xs mt-1">Team Leader: ${kontak(r.tl)} · Muthawwif: ${kontak(r.mut)}</p>
  <h4 class="font-bold text-sm mt-4 mb-2">Jamaah</h4><div>${r.anggota.map(a=>`<div class="flex items-center justify-between gap-2 text-sm border-b border-slate-100 py-1.5">
   <span>${esc(a.nama)} <span class="text-xs text-slate-400">${esc(a.tipe)}</span></span><span class="flex items-center gap-2">${bdgT(a.tahap)}<a href="${WA(a.hp)}" target="_blank" rel="noopener" class="text-lg" aria-label="WhatsApp ${esc(a.nama)}">💬</a></span></div>`).join('')||'<p class="text-xs text-slate-500">Belum ada anggota. Admin yang menempatkan jamaah ke rombongan.</p>'}</div>
  <div class="flex items-center justify-between mt-4 mb-2"><h4 class="font-bold text-sm">Kamar hotel</h4>${tl&&r.status!=='Selesai'?`<button onclick="T3.kamarModal('${r.id}')" class="btn !min-h-0 !py-1.5 bg-gold text-navy-dark">Kelola kamar</button>`:''}</div>
  <div class="space-y-2">${r.kamar.map(k=>kamarCard(k,nm(r,k.penghuni))).join('')||'<p class="text-xs text-slate-500">Belum ada data kamar.</p>'}</div></section>`;
function drawStaf(){
  const b=$('stafBody');if(!b)return;const tl=S.user.role==='Team Leader';
  const akt=stafList.filter(r=>r.status!=='Selesai'),sel=stafList.filter(r=>r.status==='Selesai');
  b.innerHTML=(akt.map(r=>kartuStaf(r,tl)).join('')||'<p class="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-5 mb-4">Belum ada rombongan aktif yang ditugaskan kepada Anda. Hubungi admin.</p>')
   +(sel.length?`<details class="mt-2"><summary class="text-sm font-bold text-slate-500 cursor-pointer py-2">Riwayat rombongan selesai (${sel.length})</summary>${sel.map(r=>kartuStaf(r,false)).join('')}</details>`:'')}

// ===== JAMAAH: panel rombongan & kamar (dipanggil setelah checklist tampil) =====
async function jamaah(){
  const n=++seq,j=await api('jamaahRombongan');
  if(n!==seq||!$('jamaahBody')||!j.success)return;
  const lama=$('romPanel');if(lama)lama.remove();
  if(!j.rombongan)return;
  const r=j.rombongan;
  const kamar=j.terlihat?(j.kamar.length?j.kamar.map(k=>kamarCard(k,k.teman.length?'Sekamar dengan: '+k.teman.join(', '):'')).join(''):'<p class="text-xs text-slate-500">Info kamar Anda belum diisi. Silakan hubungi Team Leader.</p>')
    :`<p class="text-xs text-slate-500">Info kamar hotel akan tampil mulai ${esc(j.mulai)} (5 hari sebelum berangkat).</p>`;
  $('jamaahBody').insertAdjacentHTML('beforeend',`<section id="romPanel" class="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
  <p class="text-xs text-slate-500">Rombongan Anda</p><h3 class="font-bold text-navy text-lg">${esc(r.nama)}</h3><p class="text-xs text-slate-500">${esc(r.paket)} · berangkat ${esc(r.tgl)}</p>
  <p class="text-sm mt-2">Team Leader: ${kontak(r.tl)}<br>Muthawwif: ${kontak(r.mut)}</p>
  <h4 class="font-bold text-sm mt-4 mb-2">Kamar hotel</h4><div class="space-y-2">${kamar}</div></section>`)}

return{admin,form,simpan,buka,anggota,simpanAnggota,kamarModal,kForm,kSimpan,kHapus,staf,jamaah};
})();
