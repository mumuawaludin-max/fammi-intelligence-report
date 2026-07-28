import PeriodPicker from "./PeriodPicker";
import styles from "./Header.module.css";

export default function Header({
  userName = "Demo User", role = "Kepala Sekolah", schoolName = "SMA Contoh", schoolLogoUrl = null, onLogout,
  period, onPeriodChange, showPeriod = false, inlineNav = null, bulananOptions,
}) {
  return (
    <header className={styles.header}>
      <div className={`${styles.inner} ${inlineNav ? styles.innerInline : ""}`}>
        <div className={styles.logo}>
          <img className={styles.logoImage} src="/logo-purple.png" alt="Fammi" />
        </div>

        {inlineNav && <div className={styles.inlineNavSlot}>{inlineNav}</div>}

        <div className={`${styles.right} ${showPeriod ? styles.rightKepsek : ""}`}>
          {showPeriod && period && (
            <PeriodPicker
              selectedType={period.type}
              selectedPeriod={period.period}
              onSelect={onPeriodChange}
              bulananOptions={bulananOptions}
            />
          )}
          {showPeriod && <span className={styles.divider} aria-hidden="true" />}
          {(schoolName || schoolLogoUrl) && (
            <span className={styles.schoolBrand}>
              {schoolLogoUrl && <img className={styles.schoolLogo} src={schoolLogoUrl} alt="" />}
              {schoolName && <span className={styles.schoolName}>{schoolName}</span>}
            </span>
          )}
          <div className={styles.userChip}>
            <span className={styles.avatar}>
              {schoolLogoUrl
                ? <img className={styles.avatarLogo} src={schoolLogoUrl} alt="" />
                : userName.charAt(0)}
            </span>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.rolePill}>{role}</span>
          </div>
          {onLogout && (
            <>
              <span className={styles.divider} aria-hidden="true" />
              <button className={styles.logoutBtn} onClick={onLogout} title="Keluar">
                Keluar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
