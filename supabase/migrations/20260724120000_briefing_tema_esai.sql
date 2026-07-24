-- Fase D item 12 (School Culture): tema esai staf (Q3 "yang ingin diubah", Q5 "hal menguras
-- energi", Q6 "yang ingin disampaikan"), dikelompokkan Gemini jadi satu daftar tema lintas
-- ketiga pertanyaan itu -- satu-satunya insight FIR yang lahir dari mengklasifikasi teks bebas,
-- bukan menata ulang angka final. Disimpan di kolom baru pada tabel `briefing` yang SUDAH
-- dipakai bareng Karakter (bukan tabel baru) supaya tema esai ikut lewat gerbang approve yang
-- sudah ada (ApprovalDrawer.jsx) -- TIDAK ADA layar review baru, sesuai keputusan produk.
-- Kolom ini NULL untuk modul lain (Karakter dkk), cuma diisi generateAndInsertDraftSc saat
-- tipe='briefing'.

alter table public.briefing add column if not exists tema_esai jsonb;
