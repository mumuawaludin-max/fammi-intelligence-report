-- sc_hasil.approved_at: kapan laporan individu SC ini disetujui AdminFammi (bukan kapan Gemini
-- menggenerate draf-nya -- itu sudah ada di generated_at). Dipakai sebagai titik nol "Perjalanan
-- 30 hari" di laporan individu (section Komitmen 30 hari) -- instruksi eksplisit pemilik produk:
-- hitungan 30 hari mulai dari saat laporan disetujui, bukan dari saat staf mengunci komitmennya
-- sendiri (yang bisa jauh lebih belakangan dari saat laporan pertama kali tayang).
alter table public.sc_hasil add column if not exists approved_at timestamptz;
