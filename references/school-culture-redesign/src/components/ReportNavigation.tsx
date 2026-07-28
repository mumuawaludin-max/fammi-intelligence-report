import {
  Buildings,
  HeartStraight,
  UsersThree
} from "@phosphor-icons/react";

const reports = [
  { href: "#ringkasan", label: "Budaya Kerja", detail: "Aktif", icon: UsersThree },
  { href: "#kesejahteraan", label: "Kesejahteraan Tim", detail: "Segera", icon: HeartStraight },
  { href: "#profil", label: "Profil Organisasi", detail: "Segera", icon: Buildings }
];

export function ReportNavigation() {
  return (
    <nav className="report-navigation" aria-label="Bagian laporan">
      <div className="report-navigation__track">
        {reports.map(({ href, label, detail, icon: Icon }, index) => (
          <a
            className={`report-navigation__item ${index === 0 ? "is-active" : "is-muted"}`}
            href={index === 0 ? href : undefined}
            aria-current={index === 0 ? "page" : undefined}
            aria-disabled={index !== 0}
            key={label}
          >
            <span className="report-navigation__number">0{index + 1}</span>
            <Icon weight="duotone" />
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
