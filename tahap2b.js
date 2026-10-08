// Tahap 2B: unggah dokumen, pembayaran (jamaah) dan verifikasi (admin). Dimuat sebelum tahap2.js
window.T2B=(()=>{
const rp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const WARNA={Menunggu:'bg-amber-100 text-amber-800',Disetujui:'bg-emerald-100 text-emerald-700',Terverifikasi:'bg-emerald-100 text-emerald-700',Ditolak:'bg-rose-100 text-rose-700'};
const bdg=s=>`<span class="px-2 py-0.5 rounded-full text-xs font-bold ${WARNA[s]||'bg-slate-200 text-slate-600'}">${esc(s)}</span>`;

// kompres foto di HP sebelum dikirim (maks 1280px, JPEG kualitas 70%)
function kompres(file,max,q){return new Promise((ok,err)=>{const r=new FileReader();r.onload=e=>{const i=new Image();
  i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);
  const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',q))};
  i.onerror=()=>err(new Error('Foto tidak bisa dibaca. Coba foto lain.'));i.src=e.target.result};r.readAsDataURL(file)})}
async function foto(id){const f=$(id)&&$(id).files[0];if(!f)throw new Error('Pilih atau ambil foto terlebih dahulu.');return kompres(f,1280,.7)}
async function jalankan(btn,fn){await busy(btn,async()=>{try{await fn()}catch(e){toast(e.message,false)}})}

// ===== JAMAAH =====
const up=(jenis,ekstra='')=>`<div class="mt-2 space-y-2">${ekstra}<input type="file" accept="image/*" id="u_${jenis}" class="inp">
  <button onclick="T2B.kirim('${jenis}',this)" class="btn bg-navy text-white w-full">Unggah ${jenis}</button></div>`;

function dash(s){
  const r=s.pendaftaran,p=s.paket,g=s.ringkasan||{dokumen:{},pembayaran:[],total:0,terbayar:0,sisa:0},d=g.dokumen,buka=g.terbayar>0;
  const dok=(jenis,judul,kunci,ekstra)=>{const x=d[jenis],ulang=!x||x.status==='Ditolak';
    return `<li class="rounded-xl border ${x&&x.status==='Disetujui'?'border-emerald-300 bg-emerald-50':'border-slate-200 bg-white'} p-3">
    <div class="flex items-center justify-between gap-2"><b class="text-sm">${judul}</b>${x?bdg(x.status):''}</div>
    ${x&&x.status==='Ditolak'?`<p class="text-xs text-rose-600 mt-1">Alasan: ${esc(x.catatan)}. Silakan unggah ulang.</p>`:''}
    ${ulang?(kunci?`<p class="text-xs text-slate-500 mt-1">🔒 ${kunci}</p>`:up(jenis,ekstra)):''}</li>`};
  const minP=(()=>{if(!p)return '';const t=new Date(p.tgl);t.setMonth(t.getMonth()+6);return isNaN(t)?'':t.toISOString().slice(0,10)})();
  const butuh=!(d.KTP&&d.KK);
  const rek=S.cfg.info_rekening?`<p class="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2 whitespace-pre-line"><b>Transfer ke:</b>\n${esc(S.cfg.info_rekening)}</p>`:'';
  const form=g.total>0&&g.sisa<=0?'<p class="text-xs text-emerald-700 mt-2 font-bold">Pembayaran lunas. Alhamdulillah.</p>':butuh?'<p class="text-xs text-slate-500 mt-2">🔒 Unggah KTP dan KK terlebih dahulu.</p>':
   `<div class="mt-2 space-y-2"><select id="b_tipe" class="inp" onchange="T2B.tipe(${g.sisa})"><option value="DP">DP</option><option value="Pelunasan">Pelunasan sisa tagihan</option><option value="Lunas">Bayar lunas sekaligus</option></select>
   <input id="b_jml" type="number" inputmode="numeric" class="inp" placeholder="Jumlah transfer (Rp)"><input id="b_foto" type="file" accept="image/*" class="inp">
   <button onclick="T2B.bayar(this)" class="btn bg-gold text-navy-dark w-full">Kirim bukti transfer</button></div>`;
  const riwayat=g.pembayaran.map(b=>`<li class="flex justify-between items-center text-xs border-t border-slate-100 pt-1"><span>${esc(b.tipe)} ${rp(b.jumlah)} <span class="text-slate-400">${esc(b.tgl)}</span></span>${bdg(b.status)}</li>${b.status==='Ditolak'?`<li class="text-xs text-rose-600">Alasan: ${esc(b.catatan)}</li>`:''}`).join('');
  const kunciLain='Dibuka setelah pembayaran pertama diverifikasi admin.';
  $('jamaahBody').innerHTML=`<section class="bg-white rounded-2xl border border-slate-200 p-5">
  <p class="text-xs text-slate-500">Kode pendaftaran</p><p class="text-xl font-extrabold text-navy">${esc(r.regId)}</p>
  <p class="text-sm mt-1">${p?esc(p.nama)+' · '+p.hari+' hari · berangkat '+esc(p.tgl):''}</p><p class="text-xs text-slate-500">Kamar ${esc(r.tipeKamar)} · Tahap: ${esc(r.tahap)}</p>
  <ol class="mt-4 space-y-2 text-sm">
   <li class="rounded-xl border border-emerald-300 bg-emerald-50 p-3">✅ Formulir pendaftaran selesai</li>
   ${dok('KTP','Unggah KTP')}${dok('KK','Unggah Kartu Keluarga')}
   <li class="rounded-xl border border-slate-200 p-3"><div class="flex items-center justify-between"><b>Pembayaran</b><span class="text-xs">${g.terbayar>=g.total&&g.total>0?'Lunas':'Sisa '+rp(g.sisa)}</span></div>
    <p class="text-xs text-slate-500">Total ${rp(g.total)} · terverifikasi ${rp(g.terbayar)}</p>${rek}<ul class="mt-2 space-y-1">${riwayat}</ul>${form}</li>
   ${dok('Paspor','Unggah paspor',buka?'':kunciLain,`<input id="p_no" class="inp" placeholder="Nomor paspor"><label class="block text-xs font-bold">Berlaku sampai<input id="p_exp" type="date" ${minP?`min="${minP}"`:''} class="inp mt-1"></label>${minP?`<p class="text-[11px] text-slate-500">Paspor harus berlaku minimal sampai ${minP} (6 bulan setelah tanggal berangkat).</p>`:''}`)}
   ${dok('Vaksin','Unggah bukti vaksin meningitis',buka?'':kunciLain)}
   <li class="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-400">🔒 Checklist Nusuk dan info kamar hotel (tahap berikutnya)</li>
  </ol></section>`;
  if(window.T3)T3.jamaah();if(window.T3B)T3B.panel()}

function tipe(sisa){const t=$('b_tipe').value;if(t!=='DP')$('b_jml').value=sisa}
async function kirim(jenis,btn){await jalankan(btn,async()=>{
  if(jenis==='Paspor'){if(!$('p_no').value.trim())throw new Error('Isi nomor paspor.');if(!$('p_exp').value)throw new Error('Isi tanggal berlaku paspor.')}
  const b64=await foto('u_'+jenis);
  toast('Mengunggah, mohon tunggu sebentar...');
  const j=await api('jamaahUploadDok',{jenis,base64:b64,mimeType:'image/jpeg',noPaspor:$('p_no')?$('p_no').value:'',berlaku:$('p_exp')?$('p_exp').value:''});
  toast(j.message,j.success);if(j.success)j.pendaftaran?dash(j):T2.jamaahDash()})}
async function bayar(btn){await jalankan(btn,async()=>{
  const b64=await foto('b_foto');
  toast('Mengunggah, mohon tunggu sebentar...');
  const j=await api('jamaahBayar',{tipe:$('b_tipe').value,jumlah:$('b_jml').value,base64:b64,mimeType:'image/jpeg'});
  toast(j.message,j.success);if(j.success)j.pendaftaran?dash(j):T2.jamaahDash()})}

// ===== ADMIN =====
let reg=[];
async function muat(){const j=await api('adminDaftarPendaftaran');if(j.success)reg=j.daftar;return j}
function daftarHtml(){return reg.length?`<div class="space-y-2">${reg.map(x=>{
    const tunggu=x.dokumen.filter(k=>k.status==='Menunggu').length+x.pembayaran.filter(k=>k.status==='Menunggu').length;
    return `<button onclick="T2B.buka('${x.regId}')" class="w-full text-left bg-white border ${tunggu?'border-amber-400':'border-slate-200'} rounded-xl p-3">
    <div class="flex justify-between gap-2"><b class="text-sm">${esc(x.nama)}</b><span class="text-xs text-slate-500">${esc(x.regId)}</span></div>
    <p class="text-xs text-slate-500">${esc(x.paket)} · ${esc(x.tipe)} · ${esc(x.tahap)}</p>
    <p class="text-xs mt-1">Terbayar ${rp(x.terbayar)} dari ${rp(x.total)} ${tunggu?`· <b class="text-amber-700">${tunggu} menunggu verifikasi</b>`:''}</p></button>`}).join('')}</div>`:'<p class="text-sm text-slate-500">Belum ada pendaftar.</p>'}
async function admin(){
  const b=$('adminBody');b.innerHTML='<p class="text-sm text-slate-500">Memuat pendaftar...</p>';
  const j=await muat();if(!$('adminBody')||S.tab!=='reg')return;
  if(!j.success){b.innerHTML=`<p class="text-sm text-rose-600">${esc(j.message)}</p>`;return}
  b.innerHTML=daftarHtml()}

const aksi=(t,id,rg,st)=>st!=='Menunggu'?'<span class="text-xs text-slate-400 self-center">Sudah final</span>':`<button onclick="T2B.verif('${t}','${id}','${rg}',true)" class="btn !min-h-0 !py-1.5 bg-emerald-600 text-white">${t==='Dok'?'Setujui':'Verifikasi'}</button><button onclick="T2B.verif('${t}','${id}','${rg}',false)" class="btn !min-h-0 !py-1.5 bg-rose-600 text-white">Tolak</button>`;
function buka(id){
  const x=reg.find(r=>r.regId===id);if(!x)return;
  const data=Object.entries(x.data).map(([k,v])=>`<div class="flex gap-2 text-xs border-b border-slate-100 py-1"><span class="w-32 shrink-0 text-slate-500">${esc(k)}</span><span class="break-words">${esc(v)}</span></div>`).join('');
  const dok=x.dokumen.map(k=>`<div class="rounded-xl border border-slate-200 p-2 mb-2"><div class="flex justify-between text-sm"><b>${esc(k.jenis)}</b>${bdg(k.status)}</div>
    ${k.info?`<p class="text-xs">${esc(k.info.replace('|',' · berlaku sampai '))}</p>`:''}${k.catatan?`<p class="text-xs text-rose-600">${esc(k.catatan)}</p>`:''}
    <div class="mt-2 flex gap-2 flex-wrap"><button onclick="T2B.lihat('${k.id}','${id}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Lihat</button>${aksi('Dok',k.id,id,k.status)}</div></div>`).join('')||'<p class="text-xs text-slate-500">Belum ada dokumen.</p>';
  const byr=x.pembayaran.map(k=>`<div class="rounded-xl border border-slate-200 p-2 mb-2"><div class="flex justify-between text-sm"><b>${esc(k.tipe)} ${rp(k.jumlah)}</b>${bdg(k.status)}</div>
    <p class="text-xs text-slate-500">${esc(k.tgl)}</p>${k.catatan?`<p class="text-xs text-rose-600">${esc(k.catatan)}</p>`:''}
    <div class="mt-2 flex gap-2 flex-wrap"><button onclick="T2B.lihat('${k.id}','${id}')" class="btn !min-h-0 !py-1.5 bg-slate-200">Lihat bukti</button>${aksi('Byr',k.id,id,k.status)}</div></div>`).join('')||'<p class="text-xs text-slate-500">Belum ada pembayaran.</p>';
  modal(`<h3 class="text-lg font-extrabold text-navy pr-8">${esc(x.nama)}</h3><p class="text-xs text-slate-500 mb-3">${esc(x.regId)} · ${esc(x.paket)} · ${esc(x.tahap)}</p>
   <h4 class="font-bold text-sm mb-1">Dokumen</h4>${dok}<h4 class="font-bold text-sm mt-3 mb-1">Pembayaran (terbayar ${rp(x.terbayar)} / ${rp(x.total)})</h4>${byr}
   <h4 class="font-bold text-sm mt-3 mb-1">Data formulir</h4>${data}`)}
async function lihat(id,rg){toast('Membuka berkas...');const j=await api('adminLihatFile',{id});
  if(!j.success)return toast(j.message,false);
  modal(`<img src="${j.dataUrl}" class="w-full rounded-xl mt-6" alt="Berkas"><button onclick="T2B.buka('${rg}')" class="btn bg-slate-200 w-full mt-3">Kembali</button>`)}
async function verif(t,id,rg,ok){
  let catatan='';
  if(!ok){catatan=prompt('Alasan penolakan (akan dibaca jamaah):');if(!catatan)return}
  toast('Memproses...');
  const j=await api(t==='Dok'?'adminVerifDokumen':'adminVerifBayar',{id,status:ok?(t==='Dok'?'Disetujui':'Terverifikasi'):'Ditolak',catatan});
  toast(j.message,j.success);
  if(j.rec){const i=reg.findIndex(r=>r.regId===rg);if(i>=0)reg[i]=j.rec;if(S.tab==='reg'&&$('adminBody'))$('adminBody').innerHTML=daftarHtml()}
  else await muat();
  buka(rg)}

return{dash,tipe,kirim,bayar,admin,buka,lihat,verif};
})();
