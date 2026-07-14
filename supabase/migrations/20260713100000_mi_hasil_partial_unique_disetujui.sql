-- Longgarkan unique constraint mi_hasil_murid_periode.
--
-- Ditemukan lewat produksi: generate-mi (Edge Function) gagal "duplicate key value violates
-- unique constraint mi_hasil_murid_periode" untuk siswa yang sudah punya laporan MI ERA GAS
-- (sudah disetujui, sudah tayang) di periode yang sama. Constraint lama itu berlaku untuk SEMUA
-- status sekaligus (bukan cuma disetujui), jadi generate-mi tidak bisa membuat draf baru
-- berstatus menunggu_persetujuan berdampingan dengan baris lama yang disetujui.
--
-- Ini bertentangan dengan pola yang SUDAH ada di admin-actions handleMiApproval ("Penggantian
-- mulus"): begitu draf baru disetujui, baris disetujui LAMA untuk (sekolah, murid, periode)
-- yang sama diturunkan ke status ditolak. Kode itu justru MENGASUMSIKAN banyak baris per
-- (murid, periode) bisa hidup berdampingan selama statusnya beda -- sama seperti pola
-- tindak_lanjut/briefing (boleh banyak draf/tolakan, cuma satu yang disetujui per kunci).
--
-- Perbaikan: constraint blanket diganti partial unique index yang HANYA berlaku untuk baris
-- disetujui. Draf menunggu_persetujuan tidak perlu dijaga uniknya di DB -- generate-mi sudah
-- menghapus draf lama (status menunggu_persetujuan) untuk kunci yang sama sebelum insert baru
-- (lihat index.ts "Idempoten"), jadi maksimal satu draf pending per kunci tetap terjaga dari
-- kode, bukan dari constraint.
--
-- sekolah_id disertakan (constraint lama kemungkinan cuma murid_id+periode_id, sesuai nama
-- mi_hasil_murid_periode) karena murid_id BUKAN unik lintas sekolah (format "M001" berulang
-- per sekolah, lihat miImporter.js) -- tanpa sekolah_id, murid M001 sekolah A bisa tertukar
-- constraint dengan M001 sekolah B.

alter table public.mi_hasil drop constraint if exists mi_hasil_murid_periode;

create unique index if not exists mi_hasil_murid_periode_disetujui
  on public.mi_hasil (sekolah_id, murid_id, periode_id)
  where status = 'disetujui';
