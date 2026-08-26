# Data demo School Culture: Yayasan Pendidikan Sekolah Fammi

Dibangkitkan lima migration berurutan:

- `supabase/migrations/20260826160000_sc_yps_fammi_seed_1_personal.sql` (896 KB)
- `supabase/migrations/20260826160100_sc_yps_fammi_seed_2_lembaga.sql` (43 KB)
- `supabase/migrations/20260826160200_sc_yps_fammi_seed_3_individu_a.sql` (632 KB)
- `supabase/migrations/20260826160300_sc_yps_fammi_seed_4_individu_b.sql` (631 KB)
- `supabase/migrations/20260826160400_sc_yps_fammi_seed_5_akun.sql` (42 KB)

Seluruh angka, nama, dan jawaban esai di dalamnya rekaan, bukan data sekolah sungguhan. Bagian 1 membersihkan seluruh jejak `YPS-FAMMI` lebih dulu, jadi menjalankan ulang kelimanya dari awal selalu aman.

## Ringkas

| Hal | Nilai |
| --- | --- |
| id sekolah | `YPS-FAMMI` |
| Periode | 2026-07 |
| Jumlah responden | 150 |
| Modul aktif | `sc` |
| Unit | TK Fammi (15), SD Fammi (45), SMP Fammi (35), SMA Fammi (30), SMK Fammi (15), Tata Usaha & Kantor Yayasan (10) |

## Akun

Akun kelompok. Masuk ke dashboard Laporan Lembaga (tiga section 01/02/03) dan bisa membuka drill-down laporan tiap staf yang bersedia:

| Peran | Username | Kode |
| --- | --- | --- |
| Yayasan | `ypsfammi` | `ypsfammi2026` |

Akun perorangan (peran Karyawan, laporan pribadi tampilan mobile). Kode sama untuk semuanya: `fammi2026`. Kolom terakhir menandai staf yang menjawab bersedia laporannya dibuka pimpinan; yang menjawab tidak tetap ikut agregat, tapi tidak muncul di tab Laporan Individu.

| Username | Nama | Unit | Peran kerja | Bersedia tampil ke pimpinan |
| --- | --- | --- | --- | --- |
| `ypsstaf001` | Lutfi Sanjaya | TK Fammi | Guru | Ya |
| `ypsstaf002` | Julia Maulana | TK Fammi | Guru | Ya |
| `ypsstaf003` | Mira Pratama | TK Fammi | Guru | Ya |
| `ypsstaf004` | Hana Iskandar | TK Fammi | Pimpinan Unit | Ya |
| `ypsstaf005` | Ahmad Mahendra | TK Fammi | Guru | Ya |
| `ypsstaf006` | Wulan Yuliana | TK Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf007` | Bagas Ardiansyah | TK Fammi | Guru | Ya |
| `ypsstaf008` | Maya Utami | TK Fammi | Guru | Ya |
| `ypsstaf009` | Vera Permana | TK Fammi | Guru | Ya |
| `ypsstaf010` | Erika Wicaksono | TK Fammi | Guru | Ya |
| `ypsstaf011` | Kurnia Siregar | TK Fammi | Guru | Ya |
| `ypsstaf012` | Wulan Kusuma | TK Fammi | Guru | Ya |
| `ypsstaf013` | Prita Marlina | TK Fammi | Guru | Ya |
| `ypsstaf014` | Fani Safitri | TK Fammi | Guru | Ya |
| `ypsstaf015` | Prita Mahendra | TK Fammi | Guru | Ya |
| `ypsstaf016` | Dedi Ramadhan | SD Fammi | Guru | Ya |
| `ypsstaf017` | Irfan Herlambang | SD Fammi | Pimpinan Unit | Tidak |
| `ypsstaf018` | Hesti Sanjaya | SD Fammi | Guru | Ya |
| `ypsstaf019` | Maya Wijaya | SD Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf020` | Vera Pratama | SD Fammi | Guru | Ya |
| `ypsstaf021` | Eko Wijaya | SD Fammi | Guru | Tidak |
| `ypsstaf022` | Candra Maulana | SD Fammi | Guru | Ya |
| `ypsstaf023` | Erlangga Herlambang | SD Fammi | Guru | Ya |
| `ypsstaf024` | Adit Kurniawan | SD Fammi | Guru | Ya |
| `ypsstaf025` | Wulan Fauziah | SD Fammi | Guru | Tidak |
| `ypsstaf026` | Bayu Hidayat | SD Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf027` | Dimas Hidayat | SD Fammi | Guru | Ya |
| `ypsstaf028` | Tania Permana | SD Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf029` | Taufik Iskandar | SD Fammi | Guru | Ya |
| `ypsstaf030` | Nurul Wibowo | SD Fammi | Pimpinan Unit | Ya |
| `ypsstaf031` | Fitri Fauziah | SD Fammi | Guru | Ya |
| `ypsstaf032` | Joko Gunawan | SD Fammi | Guru | Ya |
| `ypsstaf033` | Adit Sanjaya | SD Fammi | Guru | Ya |
| `ypsstaf034` | Haris Wibowo | SD Fammi | Guru | Ya |
| `ypsstaf035` | Galih Pranata | SD Fammi | Guru | Ya |
| `ypsstaf036` | Citra Siregar | SD Fammi | Guru | Tidak |
| `ypsstaf037` | Hana Rahayu | SD Fammi | Guru | Ya |
| `ypsstaf038` | Julia Pratama | SD Fammi | Guru | Ya |
| `ypsstaf039` | Vera Nasution | SD Fammi | Guru | Ya |
| `ypsstaf040` | Wulan Permana | SD Fammi | Guru | Ya |
| `ypsstaf041` | Yusuf Wijaya | SD Fammi | Guru | Ya |
| `ypsstaf042` | Laras Halim | SD Fammi | Guru | Ya |
| `ypsstaf043` | Candra Wijaya | SD Fammi | Guru | Ya |
| `ypsstaf044` | Nadia Suryani | SD Fammi | Guru | Ya |
| `ypsstaf045` | Zahra Puspita | SD Fammi | Guru | Ya |
| `ypsstaf046` | Maya Cahyono | SD Fammi | Guru | Ya |
| `ypsstaf047` | Oki Nasution | SD Fammi | Guru | Ya |
| `ypsstaf048` | Wulan Puspita | SD Fammi | Guru | Ya |
| `ypsstaf049` | Ulfa Yuliana | SD Fammi | Guru | Ya |
| `ypsstaf050` | Joko Santoso | SD Fammi | Tenaga Kependidikan | Tidak |
| `ypsstaf051` | Erika Herlambang | SD Fammi | Guru | Ya |
| `ypsstaf052` | Sinta Saputra | SD Fammi | Guru | Tidak |
| `ypsstaf053` | Ika Sanjaya | SD Fammi | Guru | Ya |
| `ypsstaf054` | Hana Hidayat | SD Fammi | Pimpinan Unit | Ya |
| `ypsstaf055` | Ulfa Amalia | SD Fammi | Guru | Ya |
| `ypsstaf056` | Fitri Safitri | SD Fammi | Guru | Ya |
| `ypsstaf057` | Sinta Gunawan | SD Fammi | Guru | Ya |
| `ypsstaf058` | Elis Novita | SD Fammi | Guru | Ya |
| `ypsstaf059` | Zaki Nasution | SD Fammi | Guru | Ya |
| `ypsstaf060` | Sinta Wicaksono | SD Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf061` | Farhan Maulana | SMP Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf062` | Elis Mahendra | SMP Fammi | Guru | Ya |
| `ypsstaf063` | Putri Lestari | SMP Fammi | Guru | Ya |
| `ypsstaf064` | Putri Pratama | SMP Fammi | Guru | Tidak |
| `ypsstaf065` | Putri Wicaksono | SMP Fammi | Guru | Ya |
| `ypsstaf066` | Nadia Fauziah | SMP Fammi | Guru | Ya |
| `ypsstaf067` | Iqbal Pranata | SMP Fammi | Guru | Ya |
| `ypsstaf068` | Bunga Yuliana | SMP Fammi | Guru | Ya |
| `ypsstaf069` | Umar Nasution | SMP Fammi | Guru | Ya |
| `ypsstaf070` | Oktavia Puspita | SMP Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf071` | Wahyu Herlambang | SMP Fammi | Guru | Ya |
| `ypsstaf072` | Fajar Permana | SMP Fammi | Guru | Tidak |
| `ypsstaf073` | Olivia Cahyono | SMP Fammi | Guru | Ya |
| `ypsstaf074` | Prita Kurniawan | SMP Fammi | Guru | Ya |
| `ypsstaf075` | Sinta Hidayat | SMP Fammi | Guru | Tidak |
| `ypsstaf076` | Gilang Nasution | SMP Fammi | Guru | Ya |
| `ypsstaf077` | Bagas Hidayat | SMP Fammi | Guru | Ya |
| `ypsstaf078` | Citra Wicaksono | SMP Fammi | Guru | Ya |
| `ypsstaf079` | Ika Hakim | SMP Fammi | Pimpinan Unit | Ya |
| `ypsstaf080` | Anisa Puspita | SMP Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf081` | Yani Iskandar | SMP Fammi | Guru | Ya |
| `ypsstaf082` | Prita Nugroho | SMP Fammi | Guru | Ya |
| `ypsstaf083` | Bunga Rahayu | SMP Fammi | Guru | Ya |
| `ypsstaf084` | Laras Wijaya | SMP Fammi | Tenaga Kependidikan | Tidak |
| `ypsstaf085` | Indah Mahendra | SMP Fammi | Guru | Tidak |
| `ypsstaf086` | Irfan Maulana | SMP Fammi | Guru | Tidak |
| `ypsstaf087` | Tania Pranata | SMP Fammi | Guru | Ya |
| `ypsstaf088` | Dinda Lestari | SMP Fammi | Tenaga Kependidikan | Tidak |
| `ypsstaf089` | Bagas Maulana | SMP Fammi | Guru | Ya |
| `ypsstaf090` | Gita Hidayat | SMP Fammi | Tenaga Kependidikan | Ya |
| `ypsstaf091` | Lestari Hakim | SMP Fammi | Guru | Tidak |
| `ypsstaf092` | Erika Gunawan | SMP Fammi | Guru | Ya |
| `ypsstaf093` | Cindy Safitri | SMP Fammi | Pimpinan Unit | Ya |
| `ypsstaf094` | Mira Herlambang | SMP Fammi | Guru | Ya |
| `ypsstaf095` | Dimas Gunawan | SMP Fammi | Guru | Ya |
| `ypsstaf096` | Dinda Mahendra | SMA Fammi | Pimpinan Unit | Ya |
| `ypsstaf097` | Hendra Gunawan | SMA Fammi | Guru | Ya |
| `ypsstaf098` | Gita Siregar | SMA Fammi | Guru | Ya |
| `ypsstaf099` | Vino Mahendra | SMA Fammi | Guru | Ya |
| `ypsstaf100` | Fajar Kurniawan | SMA Fammi | Guru | Ya |
| `ypsstaf101` | Bayu Santoso | SMA Fammi | Guru | Ya |
| `ypsstaf102` | Farhan Siregar | SMA Fammi | Guru | Ya |
| `ypsstaf103` | Hendra Nugroho | SMA Fammi | Guru | Ya |
| `ypsstaf104` | Rangga Pratama | SMA Fammi | Guru | Ya |
| `ypsstaf105` | Oktavia Permana | SMA Fammi | Guru | Ya |
| `ypsstaf106` | Gita Yuliana | SMA Fammi | Guru | Ya |
| `ypsstaf107` | Vera Prasetyo | SMA Fammi | Guru | Ya |
| `ypsstaf108` | Doni Gunawan | SMA Fammi | Guru | Ya |
| `ypsstaf109` | Bella Rahayu | SMA Fammi | Guru | Ya |
| `ypsstaf110` | Anisa Fauziah | SMA Fammi | Guru | Ya |
| `ypsstaf111` | Nadia Kurniawan | SMA Fammi | Guru | Ya |
| `ypsstaf112` | Hesti Handayani | SMA Fammi | Guru | Ya |
| `ypsstaf113` | Ghina Herlambang | SMA Fammi | Guru | Ya |
| `ypsstaf114` | Bayu Ardiansyah | SMA Fammi | Guru | Ya |
| `ypsstaf115` | Gita Santoso | SMA Fammi | Guru | Ya |
| `ypsstaf116` | Oktavia Yuliana | SMA Fammi | Pimpinan Unit | Ya |
| `ypsstaf117` | Hesti Mulyani | SMA Fammi | Guru | Ya |
| `ypsstaf118` | Galih Permana | SMA Fammi | Guru | Ya |
| `ypsstaf119` | Nanda Mahendra | SMA Fammi | Guru | Ya |
| `ypsstaf120` | Ilham Iskandar | SMA Fammi | Guru | Ya |
| `ypsstaf121` | Fitri Wijaya | SMA Fammi | Guru | Ya |
| `ypsstaf122` | Doni Nugroho | SMA Fammi | Guru | Ya |
| `ypsstaf123` | Maya Novita | SMA Fammi | Guru | Ya |
| `ypsstaf124` | Panji Prasetyo | SMA Fammi | Guru | Ya |
| `ypsstaf125` | Kurnia Prasetyo | SMA Fammi | Guru | Ya |
| `ypsstaf126` | Julia Mahendra | SMK Fammi | Guru | Ya |
| `ypsstaf127` | Dewi Hakim | SMK Fammi | Guru | Ya |
| `ypsstaf128` | Indah Yuliana | SMK Fammi | Guru | Ya |
| `ypsstaf129` | Mira Kusuma | SMK Fammi | Guru | Ya |
| `ypsstaf130` | Rizal Firmansyah | SMK Fammi | Guru | Ya |
| `ypsstaf131` | Sinta Puspita | SMK Fammi | Pimpinan Unit | Ya |
| `ypsstaf132` | Vera Hakim | SMK Fammi | Guru | Ya |
| `ypsstaf133` | Eko Ardiansyah | SMK Fammi | Guru | Ya |
| `ypsstaf134` | Zahra Iskandar | SMK Fammi | Guru | Ya |
| `ypsstaf135` | Gilang Maulana | SMK Fammi | Guru | Tidak |
| `ypsstaf136` | Citra Hakim | SMK Fammi | Guru | Ya |
| `ypsstaf137` | Eko Siregar | SMK Fammi | Guru | Ya |
| `ypsstaf138` | Dimas Pratama | SMK Fammi | Guru | Tidak |
| `ypsstaf139` | Bayu Herlambang | SMK Fammi | Guru | Ya |
| `ypsstaf140` | Tania Suryani | SMK Fammi | Guru | Ya |
| `ypsstaf141` | Rangga Halim | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |
| `ypsstaf142` | Lestari Nasution | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |
| `ypsstaf143` | Yani Firmansyah | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |
| `ypsstaf144` | Panji Santoso | Tata Usaha & Kantor Yayasan | Pimpinan Unit | Ya |
| `ypsstaf145` | Fikri Wijaya | Tata Usaha & Kantor Yayasan | Pimpinan Unit | Ya |
| `ypsstaf146` | Galih Mahendra | Tata Usaha & Kantor Yayasan | Pimpinan Unit | Ya |
| `ypsstaf147` | Doni Hakim | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |
| `ypsstaf148` | Fitri Kurniawan | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |
| `ypsstaf149` | Ghina Pranata | Tata Usaha & Kantor Yayasan | Pimpinan Unit | Ya |
| `ypsstaf150` | Kiki Mulyani | Tata Usaha & Kantor Yayasan | Tenaga Kependidikan | Ya |

## Angka agregat lembaga

Skala 0-100. Gap = harapan dikurangi kondisi saat ini; ambang tampilan dashboard: |gap| di atas 5 "Perlu perhatian", 1 sampai 5 "Ringan", di bawah 1 "Selaras".

| Tipe budaya | Saat ini | Harapan | Gap |
| --- | --- | --- | --- |
| Kekeluargaan | 67.76 | 71.43 | +3.67 |
| Inovasi | 47.5 | 68.65 | +21.15 |
| Orientasi | 56.11 | 56.85 | +0.74 |
| Aturan | 63.14 | 53.53 | -9.61 |

| Subdimensi kesejahteraan | Nilai | Kategori |
| --- | --- | --- |
| Kepuasan pada Kepemimpinan | 62.4 | Tinggi |
| Kenyamanan Bekerja | 78 | Sangat Tinggi |
| Pengembangan Diri | 55.64 | Sedang |
| Ekspektasi Terpenuhi | 65.16 | Tinggi |
| Work-Life Balance | 48.73 | Sedang |

Indeks kesejahteraan gabungan: **62** (Tinggi).

| Dimensi profil organisasi | Nilai | Harapan | Gap |
| --- | --- | --- | --- |
| Karakter Lembaga | 65.23 | 65.7 | +0.47 |
| Kepemimpinan | 56.37 | 60.7 | +4.33 |
| Manajemen | 55.5 | 61.17 | +5.67 |
| Sinergi Tim | 52.6 | 60.37 | +7.77 |
| Fokus Strategis | 61.63 | 64.3 | +2.67 |
| Kinerja/Performa | 60.4 | 63.43 | +3.03 |

| Unit | n | Budaya dominan | Indeks kesejahteraan |
| --- | --- | --- | --- |
| TK Fammi | 15 | Kekeluargaan | 71 (Tinggi) |
| SD Fammi | 45 | Kekeluargaan | 65 (Tinggi) |
| SMP Fammi | 35 | Aturan | 60 (Tinggi) |
| SMA Fammi | 30 | Orientasi | 57 (Sedang) |
| SMK Fammi | 15 | Kekeluargaan | 55 (Sedang) |
| Tata Usaha & Kantor Yayasan | 10 | Aturan | 68 (Tinggi) |

## Cerita yang dibawa data ini

- Budaya Kekeluargaan paling terasa dan hampir selaras dengan harapan, jadi ini modal, bukan masalah.
- Inovasi jadi gap terbesar: ruang mencoba metode mengajar baru dirasa jauh di bawah yang diharapkan.
- Aturan satu-satunya tipe yang harapannya lebih rendah dari kondisi sekarang, prosedur dirasa berlebih.
- Work-Life Balance jadi subdimensi kesejahteraan terendah, Kenyamanan Bekerja tertinggi.
- Sinergi Tim jadi dimensi profil organisasi terendah, sejalan dengan keluhan unit yang jalan sendiri-sendiri.
- Perbedaan antarunit tajam: TK dan SD hangat dengan kesejahteraan di atas rata-rata, SMP dan SMA lebih menekankan Aturan/Orientasi dengan kesejahteraan lebih rendah.
