// Tahap 2A: katalog paket, formulir jamaah, kelola paket (admin). Dimuat setelah script utama di index.html
window.T2=(()=>{
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const TIPE=[['Quad','hargaQuad','1 kamar 4 orang'],['Triple','hargaTriple','1 kamar 3 orang'],['Double','hargaDouble','1 kamar 2 orang']];
let paket=[],adm=[];
const sel=(a,b)=>a==b?'selected':'';
const fld=(i,l,ex='')=>`<label class="block text-xs font-bold">${l}<input id="f_${i}" class="inp mt-1" ${ex}></label>`;

async function muat(){const j=await api('getKatalog');if(j.success)paket=j.paket;return j}

function kartu(p){
  const sisa=p.kuota-p.terisi;
  return `<article class="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
  <div class="bg-navy text-white p-4"><span class="text-xs bg-gold/20 text-gold border border-gold/40 rounded-full px-2 py-0.5">${esc(p.jenis)} · ${p.hari} hari</span>
  <h3 class="font-bold mt-2">${esc(p.nama)}</h3><p class="text-xs text-slate-300">Berangkat ${esc(p.tgl)}</p></div>
  <div class="p-4 text-sm flex-1 space-y-2"><p class="text-slate-600 line-clamp-3">${esc(p.itinerary)}</p>
  <ul class="text-xs space-y-1">${TIPE.filter(t=>p[t[1]]>0).map(t=>`<li class="flex justify-between"><span>${t[0]} <span class="text-slate-400">(${t[2]})</span></span><b class="text-navy">${rp(p[t[1]])}</b></li>`).join('')}</ul></div>
  <div class="p-4 pt-0 flex items-center justify-between"><span class="text-xs ${sisa<=5?'text-rose-600 font-bold':'text-slate-500'}">Sisa ${sisa} kursi</span>
  <button ${sisa>0?'':'disabled'} onclick="T2.pilih('${p.id}')" class="btn ${sisa>0?'bg-gold text-navy-dark':'bg-slate-200 text-slate-500'}">${sisa>0?'Daftar paket ini':'Kuota penuh'}</button></div></article>`}
const grid=()=>paket.length?`<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">${paket.map(kartu).join('')}</div>`:'<p class="text-sm text-slate-500">Belum ada paket yang dibuka.</p>';

function pilih(id){
  localStorage.setItem('lb_paket',id);
  if(!S.user){modal(`<h3 class="text-lg font-extrabold text-navy">Daftar paket ini</h3><p class="text-sm text-slate-600 mt-1 mb-4">Buat akun jamaah atau masuk terlebih dahulu, lalu formulir pendaftaran akan terbuka.</p>
  <button onclick="showRegister('Jamaah')" class="btn bg-gold text-navy-dark w-full mb-2">Buat akun jamaah</button><button onclick="showLogin()" class="btn bg-slate-100 w-full">Saya sudah punya akun</button>`);return}
  if(S.user.role!=='Jamaah'){toast('Pendaftaran paket hanya untuk akun jamaah.',false);return}
  closeModal();go('dash')}

async function after(){
  if(S.view==='home'&&$('katalog')){await muat();if($('katalog'))$('katalog').innerHTML=grid()}
  else if(S.view==='dash'&&S.user){
    if(S.user.role==='Jamaah'&&$('jamaahBody'))jamaahDash();
    if(S.user.role==='Admin'&&S.tab==='paket'&&$('adminBody'))adminPaket()}}

async function jamaahDash(){
  const b=$('jamaahBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat...</p>';
  const [,s]=await Promise.all([muat(),api('jamaahStatus')]);
  if(!$('jamaahBody'))return;
  if(s.success&&s.pendaftaran)return $('jamaahBody').innerHTML=statusHtml(s);
  const pend=localStorage.getItem('lb_paket');
  if(pend&&paket.find(p=>p.id===pend))return form(pend);
  $('jamaahBody').innerHTML=`<h3 class="font-bold text-navy text-lg mb-3">Pilih paket keberangkatan</h3>`+grid()}

function statusHtml(s){
  const r=s.pendaftaran,p=s.paket;
  const langkah=['Unggah KTP dan KK','Bayar DP atau lunas','Unggah paspor dan vaksin','Checklist Nusuk','Info kamar hotel'];
  return `<section class="bg-white rounded-2xl border border-slate-200 p-5">
  <p class="text-xs text-slate-500">Kode pendaftaran</p><p class="text-xl font-extrabold text-navy">${esc(r.regId)}</p>
  <p class="text-sm mt-2">${p?esc(p.nama)+' · '+p.hari+' hari · berangkat '+esc(p.tgl):''}</p>
  <p class="text-xs text-slate-500">Kamar ${esc(r.tipeKamar)} · terdaftar ${esc(r.dibuat)}</p>
  <ol class="mt-4 space-y-2 text-sm"><li class="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">✅ Formulir pendaftaran selesai</li>
  ${langkah.map(t=>`<li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-400">🔒 ${t}</li>`).join('')}</ol>
  <p class="text-xs text-slate-500 mt-3">Tahap unggah berkas dan pembayaran dibuka pada pembaruan berikutnya.</p></section>`}

function form(id){
  const p=paket.find(x=>x.id===id),b=$('jamaahBody');if(!p||!b)return;
  const ref=localStorage.getItem('lb_ref')||'';
  b.innerHTML=`<form onsubmit="T2.kirim(event,'${p.id}')" class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
  <div><h3 class="font-bold text-navy text-lg">Formulir pendaftaran</h3><p class="text-xs text-slate-500">${esc(p.nama)} · ${p.hari} hari · berangkat ${esc(p.tgl)}</p>
  <button type="button" onclick="localStorage.removeItem('lb_paket');T2.jamaahDash()" class="text-xs text-navy underline mt-1">Ganti paket</button></div>
  <fieldset class="space-y-2"><legend class="text-xs font-bold mb-1">Tipe kamar</legend>
  ${TIPE.filter(t=>p[t[1]]>0).map((t,i)=>`<label class="flex items-center justify-between gap-2 rounded-xl border border-slate-300 p-3 text-sm"><span><input type="radio" name="f_tipe" value="${t[0]}" ${i===0?'checked':''} onchange="T2.tipe()"> ${t[0]} <span class="text-xs text-slate-500">(${t[2]})</span></span><b>${rp(p[t[1]])}</b></label>`).join('')}</fieldset>
  <div id="f_pas" class="hidden rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
  <label class="text-xs flex gap-2"><input type="checkbox" id="f_pasOn" onchange="$('f_pasBox').classList.toggle('hidden',!this.checked)"> Saya berangkat berdua dengan pasangan (suami/istri) dan ingin satu kamar.</label>
  <div id="f_pasBox" class="hidden">${fld('pasangan','Nama pasangan')}<p class="text-[11px] text-slate-500 mt-1">Kartu Keluarga yang Anda unggah nanti dipakai sebagai bukti hubungan.</p></div></div>
  <h4 class="font-bold text-sm text-navy pt-2">Data diri</h4>
  ${fld('nama','Nama lengkap (sesuai KTP)','required')}${fld('alamat','Alamat','required')}
  <div class="grid grid-cols-2 gap-3">${fld('tempat','Tempat lahir','required')}${fld('tgl','Tanggal lahir','type="date" required')}</div>
  <div class="grid grid-cols-2 gap-3">${fld('hp','Nomor HP / WhatsApp','type="tel" inputmode="numeric" required')}${fld('ktp','Nomor KTP (16 angka)','inputmode="numeric" maxlength="16" required')}</div>
  ${fld('ayah','Nama ayah kandung','required')}
  <div class="grid grid-cols-2 gap-3"><label class="block text-xs font-bold">Jenis kelamin<select id="f_jk" class="inp mt-1" required><option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></label>
  <label class="block text-xs font-bold">Ukuran baju<select id="f_baju" class="inp mt-1" required><option value="">Pilih</option>${['S','M','L','XL','XXL','XXXL'].map(x=>`<option>${x}</option>`).join('')}</select></label></div>
  <div class="grid grid-cols-2 gap-3">${fld('kerja','Pekerjaan','required')}${fld('warga','Kewarganegaraan','value="Indonesia" required')}</div>
  <label class="block text-xs font-bold">Riwayat penyakit<textarea id="f_sakit" rows="2" class="inp mt-1" placeholder="Kosongkan jika tidak ada"></textarea></label>
  <label class="text-xs flex gap-2"><input type="checkbox" id="f_setuju"> Data kesehatan ini benar dan saya setuju disimpan untuk keperluan perjalanan ibadah.</label>
  <h4 class="font-bold text-sm text-navy pt-2">Ahli waris</h4>
  ${fld('awNama','Nama lengkap','required')}<div class="grid grid-cols-2 gap-3">${fld('awHub','Hubungan','placeholder="Istri / Anak / Ibu" required')}${fld('awHp','Nomor HP','type="tel" inputmode="numeric" required')}</div>
  <h4 class="font-bold text-sm text-navy pt-2">Kontak darurat</h4>
  <div class="grid grid-cols-2 gap-3">${fld('kdNama','Nama','required')}${fld('kdHp','Nomor HP','type="tel" inputmode="numeric" required')}</div>
  <p class="text-sm rounded-xl bg-slate-50 border border-slate-200 p-3"><b>Agen / Syiar Baitullah:</b> ${ref?esc(ref):'Langsung (tanpa agen)'}</p>
  <button class="btn bg-gold text-navy-dark w-full">Kirim pendaftaran</button></form>`;
  tipe()}

function tipe(){const c=document.querySelector('input[name=f_tipe]:checked');$('f_pas')?.classList.toggle('hidden',!(c&&c.value==='Double'))}

async function kirim(e,id){e.preventDefault();await busy(e.submitter,async()=>{
  const v=i=>$('f_'+i).value,c=document.querySelector('input[name=f_tipe]:checked');
  const pas=$('f_pasOn')&&$('f_pasOn').checked&&c&&c.value==='Double'?v('pasangan'):'';
  const j=await api('jamaahDaftar',{paketId:id,tipeKamar:c?c.value:'',nama:v('nama'),alamat:v('alamat'),tempatLahir:v('tempat'),tglLahir:v('tgl'),noHp:v('hp'),
    noKtp:v('ktp'),ayah:v('ayah'),jk:v('jk'),baju:v('baju'),pekerjaan:v('kerja'),warga:v('warga'),penyakit:v('sakit'),setuju:$('f_setuju').checked,
    awNama:v('awNama'),awHub:v('awHub'),awHp:v('awHp'),kdNama:v('kdNama'),kdHp:v('kdHp'),pasangan:pas,agenId:localStorage.getItem('lb_ref')||''});
  toast(j.message,j.success);
  if(j.success){localStorage.removeItem('lb_paket');jamaahDash();scrollTo(0,0)}})}

// ===== Admin: kelola paket =====
async function adminPaket(){
  const b=$('adminBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat paket...</p>';
  const j=await api('adminDaftarPaket');if(!$('adminBody')||S.tab!=='paket')return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  adm=j.paket;
  b.innerHTML=`<button onclick="T2.pForm()" class="btn bg-gold text-navy-dark mb-3">+ Tambah paket</button><div class="space-y-2">
  ${adm.map(p=>`<div class="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2"><div><p class="font-bold text-sm">${esc(p.nama)} <span class="text-xs px-2 py-0.5 rounded-full ${p.status==='Aktif'?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-600'}">${esc(p.status)}</span></p>
  <p class="text-xs text-slate-500">${esc(p.jenis)} · ${p.hari} hari · ${esc(p.tgl)} · terisi ${p.terisi}/${p.kuota}</p></div><button onclick="T2.pForm('${p.id}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Ubah</button></div>`).join('')||'<p class="text-sm text-slate-500">Belum ada paket. Klik Tambah paket.</p>'}</div>`}

function pForm(id){
  const p=adm.find(x=>x.id===id)||{jenis:'Umroh',hari:9,status:'Aktif'};
  modal(`<h3 class="text-lg font-extrabold text-navy mb-3">${id?'Ubah paket':'Tambah paket'}</h3><form onsubmit="T2.pSimpan(event,'${id||''}')" class="space-y-3">
  ${fld('pn','Nama paket',`required value="${esc(p.nama||'')}"`)}
  <div class="grid grid-cols-2 gap-3"><label class="block text-xs font-bold">Jenis<select id="f_pj" class="inp mt-1"><option ${sel(p.jenis,'Umroh')}>Umroh</option><option ${sel(p.jenis,'Haji')}>Haji</option></select></label>
  <label class="block text-xs font-bold">Lama (hari)<select id="f_ph" class="inp mt-1">${[9,12,15].map(h=>`<option ${sel(p.hari,h)}>${h}</option>`).join('')}</select></label></div>
  ${fld('pt','Tanggal berangkat',`type="date" required value="${esc(p.tgl||'')}"`)}
  <p class="text-xs font-bold -mb-1">Harga per orang (kosongkan tipe yang tidak dijual)</p>
  <div class="grid grid-cols-3 gap-2">${fld('pq','Quad','type="number" min="0" value="'+(p.hargaQuad||'')+'"')}${fld('pr','Triple','type="number" min="0" value="'+(p.hargaTriple||'')+'"')}${fld('pd','Double','type="number" min="0" value="'+(p.hargaDouble||'')+'"')}</div>
  ${fld('pk','Kuota total',`type="number" min="1" required value="${p.kuota||''}"`)}
  <label class="block text-xs font-bold">Itinerary / fasilitas<textarea id="f_pi" rows="3" class="inp mt-1">${esc(p.itinerary||'')}</textarea></label>
  <label class="block text-xs font-bold">Status<select id="f_ps" class="inp mt-1"><option ${sel(p.status,'Aktif')}>Aktif</option><option ${sel(p.status,'Nonaktif')}>Nonaktif</option></select></label>
  <button class="btn bg-navy text-white w-full">Simpan paket</button></form>`)}

async function pSimpan(e,id){e.preventDefault();await busy(e.submitter,async()=>{
  const v=i=>$('f_'+i).value;
  const j=await api('adminSimpanPaket',{id,nama:v('pn'),jenis:v('pj'),hari:v('ph'),tgl:v('pt'),hargaQuad:v('pq'),hargaTriple:v('pr'),hargaDouble:v('pd'),kuota:v('pk'),itinerary:v('pi'),status:v('ps')});
  toast(j.message,j.success);if(j.success){closeModal();adminPaket()}})}

return{after,pilih,tipe,kirim,pForm,pSimpan,jamaahDash};
})();
render();
