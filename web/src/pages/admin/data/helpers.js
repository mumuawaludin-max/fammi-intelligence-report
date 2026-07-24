import * as XLSX from 'xlsx';

export function moduleLabel(m) {
  return { karakter: 'Karakter', mi: 'Multiple Intelligence', screening: 'Screening', cw: 'Culture & Wellbeing', sc: 'School Culture' }[m] || m;
}

export function moduleShort(m) {
  return { karakter: 'Karakter', mi: 'MI', screening: 'Screening', cw: 'Culture', sc: 'School Culture' }[m] || m;
}

export function moduleColor(m) {
  return {
    karakter: { bg: '#EDE6FB', ink: '#5418C2' },
    mi: { bg: '#E5EBF7', ink: '#3B5A9E' },
    screening: { bg: '#FBE7EA', ink: '#B03A4C' },
    cw: { bg: '#DFF7E4', ink: '#1E7A3A' },
    sc: { bg: '#FFEBCB', ink: '#8A4E00' },
  }[m] || { bg: '#F0F0F4', ink: '#4A4458' };
}

export function statusColor(s) {
  const map = {
    disetujui: { ink: '#2E9E6B', bg: '#E7F4EE', dot: '#2E9E6B', label: 'Disetujui' },
    menunggu_persetujuan: { ink: '#D69219', bg: '#FAF1DC', dot: '#D69219', label: 'Menunggu' },
    draf: { ink: '#7C7689', bg: '#F1ECE3', dot: '#7C7689', label: 'Draf' },
    ditolak: { ink: '#D6455A', bg: '#FBE7EA', dot: '#D6455A', label: 'Ditolak' },
    sukses: { ink: '#2E9E6B', bg: '#E7F4EE', dot: '#2E9E6B', label: 'Sukses' },
    gagal: { ink: '#D6455A', bg: '#FBE7EA', dot: '#D6455A', label: 'Gagal' },
    peringatan: { ink: '#D69219', bg: '#FAF1DC', dot: '#D69219', label: 'Peringatan' },
    diproses: { ink: '#4A6FBF', bg: '#E5EBF7', dot: '#4A6FBF', label: 'Diproses' },
    selesai: { ink: '#2E9E6B', bg: '#E7F4EE', dot: '#2E9E6B', label: 'Selesai' },
    revisi: { ink: '#4A6FBF', bg: '#E5EBF7', dot: '#4A6FBF', label: 'Revisi' },
  };
  return map[s] || { ink: '#4A4458', bg: '#F0F0F4', dot: '#7C7689', label: s };
}

export function prioritasColor(p) {
  return {
    tinggi: { ink: '#D6455A', bg: '#FBE7EA' },
    sedang: { ink: '#D69219', bg: '#FAF1DC' },
    rendah: { ink: '#7C7689', bg: '#F0F0F4' },
  }[p] || { ink: '#4A4458', bg: '#F0F0F4' };
}

/** Cocokkan periode satu baris terhadap filter periode multi-pilih: 'all' (sentinel, semua
 * lolos) atau array periode_id yang dicentang. */
export function periodeMatch(itemPeriode, filterPeriode) {
  if (filterPeriode === 'all') return true;
  return Array.isArray(filterPeriode) && filterPeriode.includes(itemPeriode);
}

/** Trigger download file Excel (.xlsx) dari array of object di browser. Tidak menyimpan apa
 * pun ke server. Pakai library `xlsx` yang sudah jadi dependency (dipakai juga oleh importer
 * Karakter/MI/guru) supaya tidak nambah dependency baru cuma untuk export. */
export function downloadXlsx(filename, rows) {
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Kode Akun');
  XLSX.writeFile(wb, filename.replace(/\.csv$/i, '.xlsx'));
}

export function peranColor(p) {
  const map = {
    AdminFammi: { bg: '#EDE6FB', ink: '#5418C2', label: 'Admin Fammi' },
    Yayasan: { bg: '#E5EBF7', ink: '#3B5A9E', label: 'Yayasan' },
    KepalaSekolah: { bg: '#FAF1DC', ink: '#8A6210', label: 'Kepala Sekolah' },
    WakilKepalaSekolah: { bg: '#FAF1DC', ink: '#8A6210', label: 'Wakil Kepala Sekolah' },
    Manajemen: { bg: '#F4EFFD', ink: '#5418C2', label: 'Manajemen' },
    Karyawan: { bg: '#DFF7E4', ink: '#1E7A3A', label: 'Karyawan' },
    WaliKelas: { bg: '#E7F4EE', ink: '#1E7A50', label: 'Wali Kelas' },
    OrangTua: { bg: '#FDE2FE', ink: '#843D8A', label: 'Orang Tua' },
    Siswa: { bg: '#F1ECE3', ink: '#7C6A48', label: 'Siswa' },
  };
  return map[p] || { bg: '#F0F0F4', ink: '#4A4458', label: p };
}
