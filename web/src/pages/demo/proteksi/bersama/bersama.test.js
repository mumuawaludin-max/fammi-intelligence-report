// Uji data bersama prototipe Sekolah Proteksi: data contoh HEART, checklist, notifikasi, dan alur
// tidak boleh saling bertentangan, karena satu data dipakai banyak layar.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ANAK_2B,
  HEART,
  HEART_IDS,
  LAPORAN_RAKA,
  RINGKAS_2B,
  RINGKAS_SEKOLAH,
  STATUS,
  cariAspek,
  statusDariSkor,
  statusTerberat,
} from "./heart.js";
import { BELUM_BUDDY_2B, BUDDY_2B, DUKUNGAN_RAKA } from "./dukungan.js";
import { CENTANG_AWAL, CHECKLIST, LABEL_ALUR, PEMILIK } from "./tindakLanjut.js";
import { NOTIFIKASI_AWAL } from "./notifikasi.js";
import { ALUR, TAHAP_KASUS } from "./alur.js";
import { LAYAR_IDS, ORANG, TAB, cariLayar } from "../layarProteksi.js";

test("HEART: lima aspek, kode H E A R T, lima indikator, ambang naik", () => {
  assert.deepEqual(HEART.map((a) => a.kode).join(""), "HEART");
  for (const a of HEART) {
    assert.equal(a.indikator.length, 5, `${a.id} harus punya 5 indikator`);
    assert.ok(a.ambang.perhatian < a.ambang.waspada && a.ambang.waspada <= 10, `${a.id}: ambang tidak urut`);
    assert.equal(cariAspek(a.kode), a);
    assert.equal(cariAspek(a.id), a);
  }
  assert.equal(cariAspek("X"), null);
});

test("laporan Raka: status tiap aspek sesuai skor dan ambang, status anak = aspek terberat", () => {
  const statusAspek = [];
  for (const a of HEART) {
    const hasil = LAPORAN_RAKA.aspek[a.id];
    assert.ok(hasil, `aspek ${a.id} hilang`);
    assert.equal(hasil.status, statusDariSkor(a, hasil.skor), `${a.id}: status tidak cocok dengan skor ${hasil.skor}`);
    assert.equal(hasil.indikator.length, 5, `${a.id}: indikator harus 5`);
    for (const ind of hasil.indikator) assert.ok(STATUS[ind.status] && ind.deskripsi, `${a.id}: indikator tidak lengkap`);
    assert.ok(hasil.pendukung.length >= 2, `${a.id}: faktor pendukung kosong`);
    assert.ok(hasil.saran.length >= 1 && hasil.saran.every((x) => x.lakukan && x.caranya.length), `${a.id}: saran tidak lengkap`);
    statusAspek.push(hasil.status);
  }
  assert.equal(LAPORAN_RAKA.status, statusTerberat(statusAspek));
});

test("kelas 2B: 28 anak, status anak = aspek terberat, ringkasan cocok", () => {
  assert.equal(ANAK_2B.length, 28);
  for (const anak of ANAK_2B) {
    if (anak.heart === null) {
      assert.equal(anak.status, "belum", `${anak.nama}: tanpa hasil harus belum`);
      continue;
    }
    assert.deepEqual(Object.keys(anak.heart), HEART_IDS);
    assert.equal(anak.status, statusTerberat(Object.values(anak.heart)), `${anak.nama}: status anak tidak cocok`);
  }
  const raka = ANAK_2B.find((a) => a.nama === LAPORAN_RAKA.anak.nama);
  for (const a of HEART) assert.equal(raka.heart[a.id], LAPORAN_RAKA.aspek[a.id].status, `Raka ${a.id} beda dengan laporannya`);
  assert.equal(RINGKAS_2B.baik + RINGKAS_2B.perhatian + RINGKAS_2B.waspada + RINGKAS_2B.belum, RINGKAS_2B.total);
});

test("ringkasan sekolah: jumlah per status dan per aspek sama dengan anak terpetakan", () => {
  const r = RINGKAS_SEKOLAH;
  assert.equal(r.baik + r.perhatian + r.waspada, r.terpetakan);
  for (const id of HEART_IDS) {
    const x = r.perAspek[id];
    assert.equal(x.baik + x.perhatian + x.waspada, r.terpetakan, `${id}: sebaran tidak berjumlah ${r.terpetakan}`);
  }
});

test("peta dukungan dan buddy: anak dan buddy ada di kelas 2B, buddy Raka sama di semua tempat", () => {
  const nama = new Set(ANAK_2B.map((a) => a.nama));
  for (const b of BUDDY_2B) {
    assert.ok(nama.has(b.anak) && nama.has(b.buddy), `pasangan buddy tidak dikenal: ${b.anak} - ${b.buddy}`);
    assert.notEqual(b.anak, b.buddy);
  }
  const dipakai = BUDDY_2B.flatMap((b) => [b.anak, b.buddy]);
  assert.equal(new Set(dipakai).size, dipakai.length, "satu anak muncul di dua pasangan buddy");
  for (const x of BELUM_BUDDY_2B) {
    assert.ok(nama.has(x.anak) && x.calon.every((c) => nama.has(c)));
    assert.ok(!dipakai.includes(x.anak), `${x.anak} sudah punya buddy`);
  }
  const buddyRaka = DUKUNGAN_RAKA.kelompok.flatMap((k) => k.orang).find((o) => o.buddy);
  assert.equal(buddyRaka.nama, BUDDY_2B.find((b) => b.anak === "Raka Pratama").buddy);
});

test("checklist: id unik, pemilik dan aspek dikenal, keadaan awal lengkap", () => {
  const id = CHECKLIST.map((c) => c.id);
  assert.equal(new Set(id).size, id.length);
  for (const c of CHECKLIST) {
    assert.ok(PEMILIK[c.oleh], `${c.id}: pemilik ${c.oleh} tidak dikenal`);
    assert.ok(LABEL_ALUR[c.alur], `${c.id}: alur ${c.alur} tidak dikenal`);
    if (c.aspek !== null) assert.ok(cariAspek(c.aspek), `${c.id}: aspek ${c.aspek} tidak dikenal`);
    assert.equal(typeof CENTANG_AWAL[c.id], "boolean");
  }
});

test("notifikasi: peran dikenal, tujuan layar ada, id unik", () => {
  const id = NOTIFIKASI_AWAL.map((n) => n.id);
  assert.equal(new Set(id).size, id.length);
  for (const n of NOTIFIKASI_AWAL) {
    assert.ok(ORANG[n.peran], `${n.id}: peran ${n.peran} tidak dikenal`);
    assert.ok(cariLayar(n.tujuan.layar), `${n.id}: layar ${n.tujuan.layar} tidak ada`);
    assert.ok(n.judul && n.isi && n.waktu, `${n.id}: teks tidak lengkap`);
  }
  for (const peran of Object.keys(ORANG)) {
    assert.ok(NOTIFIKASI_AWAL.some((n) => n.peran === peran && !n.dibaca), `${peran} tidak punya notifikasi baru`);
  }
});

test("alur dan tab: tiap langkah dan tab menunjuk layar yang ada, tahap kasus lengkap", () => {
  for (const alur of Object.values(ALUR)) {
    for (const l of alur.langkah) assert.ok(LAYAR_IDS.includes(l.layar), `${alur.id}/${l.id}: layar ${l.layar} tidak ada`);
  }
  const tahap = ALUR.kejadian.langkah.filter((l) => l.aksi?.jenis === "tahap").map((l) => l.aksi.id);
  for (const t of tahap) assert.ok(TAHAP_KASUS.includes(t));
  for (const t of TAB) assert.ok(LAYAR_IDS.includes(t.layar), `tab ${t.id} membuka layar yang tidak ada`);
  for (const l of LAYAR_IDS) assert.ok(TAB.some((t) => t.id === cariLayar(l).tab), `${l}: tab ${cariLayar(l).tab} tidak ada`);
});
