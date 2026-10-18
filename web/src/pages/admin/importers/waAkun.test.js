// Uji penyusun tautan akun Wellbeing Assessment. Jalankan: npm test (dari folder web/).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cocokkanNamaWa, kunciNama, susunTautanWa, usernameDariNama } from "./waAkun.js";

test("nama dinormalkan tanpa gelar dan tanda baca", () => {
  assert.equal(kunciNama("Mutmainnah, S.Pd"), "mutmainnah");
  assert.equal(kunciNama("Hj. Sitti  Rahma S.Pd.I"), "sitti rahma");
  assert.equal(usernameDariNama("Fatmawaty Syam, S.Pd."), "fatmawaty.syam");
});

test("saran tautan hanya untuk satu nama yang persis sama", () => {
  const individu = [{ id: "R1", nama: "Ani Lestari" }, { id: "R2", nama: "Budi" }, { id: "R3", nama: "Budi" }];
  assert.equal(cocokkanNamaWa("Ani Lestari, S.Pd", individu).id, "R1");
  assert.equal(cocokkanNamaWa("Budi", individu), null);
  assert.equal(cocokkanNamaWa("Ani Lestar", individu), null);
});

test("rencana tautan: sudah, tautkan, ragu, buat", () => {
  const individu = [
    { id: "R1", nama: "Ani Lestari" },
    { id: "R2", nama: "Budi Santoso" },
    { id: "R3", nama: "Citra" },
    { id: "R4", nama: "Dewi Anggraini" },
    { id: "R5", nama: "Dewi Anggraini" },
  ];
  const akun = [
    { id: "a1", nama: "Ani Lestari", username: "ani.lestari", peran: "Pegawai", wa_individu_id: "R1" },
    { id: "a2", nama: "Budi Santoso, S.Pd", username: "budi.santoso", peran: "Pegawai", sw_individu_id: "p9" },
    { id: "a3", nama: "Citra", username: "citra", peran: "Pegawai" },
    { id: "a4", nama: "Citra", username: "citra2", peran: "Pegawai" },
    { id: "a5", nama: "Kepala", username: "kepala", peran: "KepalaUnit" },
  ];
  const r = susunTautanWa({ individu, akun, usernameTerpakai: ["ani.lestari", "budi.santoso", "citra", "citra2", "dewi.anggraini"] });
  assert.deepEqual(r.map((x) => x.status), ["sudah", "tautkan", "ragu", "buat", "buat"]);
  assert.equal(r[1].akun.id, "a2");
  assert.equal(r[2].kandidat.length, 2);
  assert.equal(r[3].usernameBaru, "dewi.anggraini2");
  assert.equal(r[4].usernameBaru, "dewi.anggraini3");
});

test("akun bernama sama yang sudah bertaut ke isian lain tidak ditimpa", () => {
  const r = susunTautanWa({
    individu: [{ id: "R9", nama: "Eka" }],
    akun: [{ id: "a1", nama: "Eka", username: "eka", peran: "Pegawai", wa_individu_id: "R8" }],
  });
  assert.equal(r[0].status, "ragu");
});
