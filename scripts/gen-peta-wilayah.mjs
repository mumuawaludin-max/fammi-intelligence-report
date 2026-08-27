/**
 * Membangkitkan berkas geometri peta wilayah Indonesia untuk dashboard YPT.
 *
 * Masukan  : GeoJSON hasil mapshaper dari shapefile geoBoundaries.
 * Keluaran : web/public/peta-idn-<level>.json, dipakai PetaProvinsi.jsx.
 *
 * ── Sumber data dan lisensi ──────────────────────────────────────────────────────────────────
 * geoBoundaries, build 12 Desember 2023.
 *   ADM1 (34 provinsi)        : rilis gbHumanitarian, sumber OCHA ROAP lewat HDX.
 *   ADM2 (519 kabupaten/kota) : rilis gbOpen, sumber Badan Pusat Statistik lewat WFP dan OCHA.
 *   Lisensi keduanya : CC BY 3.0 IGO. Boleh dipakai komersial, WAJIB mencantumkan atribusi.
 *   Atribusi         : ditanam di berkas keluaran (field `atribusi`) DAN ditampilkan di kaki
 *                      peta. Jangan hapus keduanya; itu syarat lisensinya, bukan hiasan.
 *
 * ADM1 SENGAJA diambil dari rilis gbHumanitarian, bukan gbOpen. gbOpen untuk ADM1 Indonesia
 * bersumber OpenStreetMap dengan lisensi ODbL, yang berbagi-serupa dan menuntut penanganan
 * berbeda untuk produk komersial. Rilis gbHumanitarian memakai jalur data dan lisensi yang sama
 * dengan ADM2 di atas.
 *
 * Batasnya versi 34 provinsi, yaitu sebelum pemekaran Papua 2022 menjadi 38. Tidak berpengaruh
 * untuk YPT: satu-satunya sekolah di tanah Papua ada di Kota Jayapura, yang tetap berada di
 * provinsi Papua setelah pemekaran. Kalau nanti ada sekolah di Papua Selatan, Papua Tengah,
 * Papua Pegunungan, atau Papua Barat Daya, berkas ini harus diganti lebih dulu.
 *
 * Unduhan (masing-masing berisi .shp/.dbf/.shx):
 *   ADM1: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbHumanitarian/
 *         IDN/ADM1/geoBoundaries-IDN-ADM1-all.zip   (69 MB)
 *   ADM2: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/
 *         IDN/ADM2/geoBoundaries-IDN-ADM2-all.zip   (99 MB)
 *
 * Shapefile mentahnya TIDAK ikut ter-commit. Ukurannya puluhan sampai ratusan megabita dan tidak
 * pernah dibaca saat runtime; yang dibutuhkan aplikasi cuma hasil olahan di bawah 150 KB. Script
 * ini yang menjadi catatan cara membangkitkannya ulang.
 *
 * ── Cara menjalankan ─────────────────────────────────────────────────────────────────────────
 *   1. Unduh dan ekstrak zip di atas ke sebuah folder, misal /tmp/adm1
 *   2. npx mapshaper /tmp/adm1/geoBoundaries-IDN-ADM1.shp \
 *        -filter-fields shapeName \
 *        -simplify visvalingam percentage=0.4% keep-shapes \
 *        -o /tmp/adm1/adm1.json format=geojson precision=0.001
 *   3. node scripts/gen-peta-wilayah.mjs /tmp/adm1/adm1.json adm1
 *
 * ── Kenapa 0,4% untuk ADM1 ───────────────────────────────────────────────────────────────────
 * Angkanya jauh lebih kecil daripada yang dipakai ADM2 (6%) karena masukannya berbeda: berkas
 * ADM2 yang dipakai adalah varian `_simplified` yang sudah dikurangi di hulu, sedangkan ADM1
 * ini shapefile resolusi penuh. Diukur langsung pada berkas ini: 0,4% menghasilkan 223 KB
 * GeoJSON, 0,8% menghasilkan 425 KB, dan 1,5% menghasilkan 765 KB tanpa perbedaan yang terlihat
 * pada lebar layar dashboard. `keep-shapes` wajib ada, tanpa itu provinsi kepulauan seperti
 * Maluku Utara kehilangan sebagian besar pulaunya dan pembaca tidak akan pernah tahu.
 *
 * ── Kenapa diproyeksikan di sini, bukan di browser ───────────────────────────────────────────
 * Proyeksinya ekuirektangular sederhana pada bingkai yang SAMA dengan KOTA_COORDS di yptMeta.js
 * (lon 94..142, lat 7.5..-11.5). Menghitungnya di sini berarti browser tidak perlu memuat
 * pustaka proyeksi apa pun, dan koordinat keluarannya bisa disimpan sebagai bilangan bulat yang
 * jauh lebih ringkas daripada derajat pecahan.
 *
 * PENTING: bingkai ini harus tetap sama persis dengan PETA_RASIO dan KOTA_COORDS. Ketiganya satu
 * paket. Mengubah salah satu tanpa dua lainnya membuat marker kota meleset dari kabupatennya.
 */

import fs from "node:fs";
import path from "node:path";

// Bingkai proyeksi, identik dengan generator peta titik sebelumnya dan dengan KOTA_COORDS.
const LON_MIN = 94;
const LON_MAX = 142;
const LAT_MAX = 7.5;
const LAT_MIN = -11.5;

/**
 * Satuan SVG per derajat. 200 berarti resolusi sekitar 550 meter, cukup halus untuk zoom 8x
 * sekalipun, sambil tetap membuat seluruh koordinat muat sebagai bilangan bulat pendek.
 */
const SKALA = 200;

const LEBAR = Math.round((LON_MAX - LON_MIN) * SKALA);   // 9600
const TINGGI = Math.round((LAT_MAX - LAT_MIN) * SKALA);  // 3800

const ATRIBUSI = {
  adm1: "Batas wilayah: geoBoundaries IDN ADM1 (gbHumanitarian), sumber OCHA ROAP via HDX. "
    + "Lisensi CC BY 3.0 IGO.",
  adm2: "Batas wilayah: geoBoundaries IDN ADM2 (gbOpen), sumber Badan Pusat Statistik via "
    + "WFP/OCHA. Lisensi CC BY 3.0 IGO.",
};

function proyeksi([lon, lat]) {
  return [
    Math.round((lon - LON_MIN) * SKALA),
    Math.round((LAT_MAX - lat) * SKALA),
  ];
}

/**
 * Satu cincin poligon jadi potongan path SVG dengan delta bilangan bulat.
 *
 * Titik yang jatuh di piksel yang sama setelah pembulatan dibuang. Pada zoom penuh itu bukan
 * kehilangan informasi apa pun, tapi menghapus sekitar sepertiga simpul dari garis pantai yang
 * berkelok rapat.
 *
 * Mengembalikan null untuk cincin yang tersisa kurang dari tiga titik; itu bukan lagi poligon
 * dan hanya akan menghasilkan path rusak.
 */
function cincinKePath(cincin) {
  const titik = [];
  let sebelumnya = null;

  for (const koord of cincin) {
    const p = proyeksi(koord);
    if (sebelumnya && p[0] === sebelumnya[0] && p[1] === sebelumnya[1]) continue;
    titik.push(p);
    sebelumnya = p;
  }

  if (titik.length < 3) return null;

  const bagian = [`M${titik[0][0]} ${titik[0][1]}l`];
  const delta = [];
  for (let i = 1; i < titik.length; i++) {
    delta.push(`${titik[i][0] - titik[i - 1][0]} ${titik[i][1] - titik[i - 1][1]}`);
  }
  // Perintah `l` ditulis sekali lalu pasangan koordinatnya beruntun. SVG mengulang perintah
  // terakhir secara implisit, jadi ini sah dan memangkas satu huruf per simpul.
  return `${bagian[0]}${delta.join(" ")}Z`;
}

function bacaGeoJson(berkas) {
  const isi = JSON.parse(fs.readFileSync(berkas, "utf8"));
  if (!isi.features) throw new Error(`${berkas} bukan FeatureCollection.`);
  return isi.features;
}

function main() {
  const masukan = process.argv[2];
  const level = (process.argv[3] || "adm1").toLowerCase();

  if (!masukan || !ATRIBUSI[level]) {
    console.error("Pemakaian: node scripts/gen-peta-wilayah.mjs <geojson> <adm1|adm2>");
    process.exit(1);
  }

  const features = bacaGeoJson(masukan);
  const wilayah = [];
  let cincinDibuang = 0;

  for (const f of features) {
    const nama = (f.properties?.shapeName || "").trim();
    if (!nama) continue;

    const geom = f.geometry;
    if (!geom) continue;

    // Polygon dan MultiPolygon diperlakukan sama: kumpulan cincin. Cincin dalam (lubang) ikut
    // terbawa dan digambar dengan fill-rule evenodd di komponen, jadi danau dan enklave tidak
    // menutupi wilayah tetangganya.
    const poligon = geom.type === "Polygon" ? [geom.coordinates]
      : geom.type === "MultiPolygon" ? geom.coordinates
        : [];

    const path = [];
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;

    for (const poli of poligon) {
      for (const cincin of poli) {
        const d = cincinKePath(cincin);
        if (!d) { cincinDibuang++; continue; }
        path.push(d);
        for (const koord of cincin) {
          const [x, y] = proyeksi(koord);
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (path.length === 0) continue;

    wilayah.push({
      n: nama,
      d: path.join(""),
      // Kotak pembatas dipakai untuk zoom-ke-wilayah dan penempatan label. Dihitung di sini
      // supaya browser tidak perlu mengurai ulang seluruh path cuma untuk tahu letaknya.
      b: [minX, minY, maxX - minX, maxY - minY],
    });
  }

  wilayah.sort((a, b) => a.n.localeCompare(b.n, "id"));

  const keluaran = {
    atribusi: ATRIBUSI[level],
    level,
    bingkai: { lonMin: LON_MIN, lonMax: LON_MAX, latMin: LAT_MIN, latMax: LAT_MAX, skala: SKALA },
    viewBox: [0, 0, LEBAR, TINGGI],
    wilayah,
  };

  const tujuan = path.resolve(`web/public/peta-idn-${level}.json`);
  fs.writeFileSync(tujuan, JSON.stringify(keluaran));

  const ukuran = fs.statSync(tujuan).size;
  console.log(`${wilayah.length} wilayah ${level} ditulis ke ${tujuan}`);
  console.log(`ukuran ${(ukuran / 1024).toFixed(1)} KB, viewBox ${LEBAR}x${TINGGI}`);
  if (cincinDibuang > 0) {
    console.log(`${cincinDibuang} cincin dibuang karena tersisa kurang dari tiga titik unik.`);
  }
}

main();
