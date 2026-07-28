import { DownloadSimple, CaretDown, ChartDonut } from "@phosphor-icons/react";

interface ReportHeaderProps {
  schoolName: string;
}

export function ReportHeader({ schoolName }: ReportHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#ringkasan" aria-label="School Culture, kembali ke ringkasan">
          <span className="brand__mark" aria-hidden="true">
            <ChartDonut weight="duotone" />
          </span>
          <span>School Culture</span>
        </a>

        <div className="report-mode" role="group" aria-label="Jenis laporan">
          <button className="report-mode__button is-active" type="button">
            Laporan Lembaga
          </button>
          <button className="report-mode__button" type="button">
            Laporan Individu
          </button>
        </div>

        <div className="app-header__actions">
          <button className="school-switcher" type="button" aria-label={`Pilih lembaga, saat ini ${schoolName}`}>
            <span>{schoolName}</span>
            <CaretDown weight="bold" />
          </button>
          <button className="button button--outline export-button" type="button" onClick={() => window.print()}>
            <DownloadSimple weight="bold" />
            <span>Ekspor laporan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
