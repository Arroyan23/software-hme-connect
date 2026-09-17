const field=(name,label,type='text',options) => ({name,label,type,options});
const alumni=[field('name','Nama Alumni'),field('angkatan','Angkatan'),field('company','Perusahaan'),field('position','Posisi'),field('title','Judul Informasi'),field('type','Tipe','select',['Lowongan','Program','Sharing','Beasiswa']),field('desc','Deskripsi','textarea'),field('link','Tautan informasi','optional-url')];
export const fields={
  tensi:[field('title','Judul'),field('category','Kategori','select',['Magang','Beasiswa','Lomba','Informasi','MSIB']),field('excerpt','Deskripsi','textarea'),field('date','Tanggal','date'),field('body','Isi lengkap','optional-textarea'),field('link','Tautan informasi','optional-url')],
  kegiatan:[field('title','Nama Kegiatan'),field('date','Tanggal','date'),field('type','Tipe','select',['Seminar','Workshop','Baksos','Kompetisi','Kunjungan','Lainnya']),field('location','Lokasi'),field('desc','Deskripsi','textarea'),field('image','Gambar','image'),field('link','Tautan kegiatan','optional-url')],
  alumni,
  dosen:[field('name','Nama Dosen'),field('photo','Foto','image')],
  petinggi:[field('name','Nama'),field('jabatan','Jabatan'),field('angkatan','Angkatan'),field('photo','Foto Pengurus','image')],
  divisi:[field('nama','Nama Divisi'),field('kepanjangan','Nama Lengkap Divisi'),field('kepala','Kepala Divisi'),field('photo','Foto Background Divisi','image'),field('anggota','Jumlah Anggota','number'),field('color','Warna','color',['bg-[#c9970d]','bg-indigo-500','bg-violet-500','bg-pink-500','bg-amber-500','bg-teal-500','bg-green-500','bg-orange-500'])],
  settings:[field('periode','Periode Kepengurusan'),field('address','Alamat'),field('email','Email','email'),field('phone','Telepon'),...['instagram','youtube','linkedin','twitter'].map(name => field(name,name,'optional-url'))],
  'submit-alumni':[...alumni,field('email','Email pengirim','email')],
  anggota:[field('name','Nama Lengkap'),field('nim','NIM'),field('email','Email','email'),field('angkatan','Angkatan'),field('phone','Nomor Telepon','tel'),field('motivation','Motivasi Bergabung','textarea')],
};
export const labels={tensi:'Info TENSI',kegiatan:'Kegiatan',alumni:'Info Alumni',dosen:'Dosen',petinggi:'Pimpinan Himpunan',divisi:'Divisi',settings:'Pengaturan',anggota:'Pendaftaran Anggota','submit-alumni':'Kirim Info Alumni'};
