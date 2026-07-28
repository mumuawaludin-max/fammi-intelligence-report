import { useState } from "react";
import { PaReveal } from "./PaReveal";
import { PaDialog } from "./PaDialog";
import tokens from "./paTokens.module.css";
import styles from "./PaInfoBanner.module.css";

/**
 * PaInfoBanner -- pengingat tetap di bawah kartu pemilih bagian: hasil asesmen ini alat
 * skrining, bukan diagnosis. Sengaja dipasang di level halaman (bukan di satu bagian saja)
 * karena berlaku untuk seluruh angka di laporan ini, termasuk daftar nama di bagian 03.
 */
export function PaInfoBanner() {
  const [terbuka, setTerbuka] = useState(false);

  return (
    <>
      <PaReveal className={`${tokens.scope} ${styles.banner}`} delay={0.04}>
        <span className={styles.icon} aria-hidden="true">i</span>
        <div className={styles.text}>
          <p className={styles.title}>Asesmen adalah alat skrining, bukan diagnosis.</p>
          <p className={styles.detail}>
            Temuan perlu ditelaah bersama konselor, wali kelas, dan orang tua dengan menjaga
            kerahasiaan siswa.
          </p>
        </div>
        <button type="button" className={styles.link} onClick={() => setTerbuka(true)}>
          Pelajari interpretasi
        </button>
      </PaReveal>

      {terbuka && (
        <PaDialog
          eyebrow="Cara membaca laporan"
          title="Pelajari interpretasi"
          subtitle="Empat hal yang membedakan hasil skrining dari kesimpulan tentang seorang anak."
          onClose={() => setTerbuka(false)}
        >
          <ol className={styles.panduan}>
            <li>
              <strong>Skor tinggi berarti perilaku sering muncul, bukan ada gangguan.</strong> Yang
              ditangkap instrumen adalah frekuensi perilaku yang terlihat, bukan sebabnya.
            </li>
            <li>
              <strong>Satu domain tinggi belum cukup.</strong> Perhatikan siswa yang tinggi di lebih
              dari satu domain atau yang bertahan tinggi antarperiode.
            </li>
            <li>
              <strong>Konteks usia dan situasi menentukan.</strong> Perilaku yang wajar di kelas
              rendah bisa berarti lain di jenjang atas, begitu pula sebaliknya.
            </li>
            <li>
              <strong>Tindak lanjut pertama selalu percakapan.</strong> Telaah bersama wali kelas dan
              konselor lebih dulu sebelum menghubungi orang tua atau merujuk ke luar sekolah.
            </li>
          </ol>
        </PaDialog>
      )}
    </>
  );
}
