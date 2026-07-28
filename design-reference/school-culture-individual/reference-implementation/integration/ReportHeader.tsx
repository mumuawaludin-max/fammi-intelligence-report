import {
  DownloadSimple,
  CaretDown,
  ChartDonut,
  User
} from "@phosphor-icons/react";

interface ReportHeaderProps {
  schoolName: string;
  onOpenIndividual: () => void;
}

export function ReportHeader({
  schoolName,
  onOpenIndividual
}: ReportHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#report-top" aria-label="School Culture, kembali ke bagian atas laporan">
          <span className="brand__mark" aria-hidden="true">
            <ChartDonut weight="duotone" />
          </span>
          <span>School Culture</span>
        </a>

        <div className="report-mode" role="group" aria-label="Jenis laporan">
          <button
            className="report-mode__button is-active"
            type="button"
            aria-pressed="true"
          >
            Laporan Lembaga
          </button>
          <button
            className="report-mode__button"
            type="button"
            onClick={onOpenIndividual}
            aria-pressed="false"
          >
            Laporan Individu
          </button>
        </div>

        <div className="app-header__actions">
          <button
            className="mobile-individual-entry"
            type="button"
            onClick={onOpenIndividual}
          >
            <User weight="duotone" />
            <span>Individu</span>
          </button>
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
