export function moduleLabel(m) {
  return { karakter: 'Karakter', mi: 'Multiple Intelligence', screening: 'Screening' }[m] || m;
}

export function moduleShort(m) {
  return { karakter: 'Karakter', mi: 'MI', screening: 'Screening' }[m] || m;
}

export function moduleColor(m) {
  return {
    karakter: { bg: '#EDE6FB', ink: '#5418C2' },
    mi: { bg: '#E5EBF7', ink: '#3B5A9E' },
    screening: { bg: '#FBE7EA', ink: '#B03A4C' },
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

/** Trigger download file CSV dari array of object di browser. Tidak menyimpan apa pun ke server. */
export function downloadCsv(filename, rows) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function peranColor(p) {
  const map = {
    AdminFammi: { bg: '#EDE6FB', ink: '#5418C2', label: 'Admin Fammi' },
    Yayasan: { bg: '#E5EBF7', ink: '#3B5A9E', label: 'Yayasan' },
    KepalaSekolah: { bg: '#FAF1DC', ink: '#8A6210', label: 'Kepala Sekolah' },
    WakilKepalaSekolah: { bg: '#FAF1DC', ink: '#8A6210', label: 'Wakil Kepala Sekolah' },
    WaliKelas: { bg: '#E7F4EE', ink: '#1E7A50', label: 'Wali Kelas' },
    OrangTua: { bg: '#FDE2FE', ink: '#843D8A', label: 'Orang Tua' },
    Siswa: { bg: '#F1ECE3', ink: '#7C6A48', label: 'Siswa' },
  };
  return map[p] || { bg: '#F0F0F4', ink: '#4A4458', label: p };
}
