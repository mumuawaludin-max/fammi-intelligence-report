import { useMemo, useState } from "react";
import { ActionPlan } from "./components/ActionPlan";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { GapComparison } from "./components/GapComparison";
import { ReportHeader } from "./components/ReportHeader";
import { ReportNavigation } from "./components/ReportNavigation";
import { sampleReport } from "./data/sampleReport";
import type { DimensionKey, SchoolCultureReport } from "./types/report";

interface AppProps {
  report?: SchoolCultureReport;
}

export default function App({ report = sampleReport }: AppProps) {
  const [selectedKey, setSelectedKey] = useState<DimensionKey>(
    report.dominantDimension
  );

  const selected = useMemo(
    () =>
      report.dimensions.find((dimension) => dimension.key === selectedKey) ??
      report.dimensions[0],
    [report.dimensions, selectedKey]
  );

  const prioritize = (key: DimensionKey) => {
    setSelectedKey(key);
    document
      .getElementById("tindak-lanjut")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <a className="skip-link" href="#ringkasan">
        Lewati ke isi laporan
      </a>
      <ReportHeader schoolName={report.schoolName} />
      <main>
        <ReportNavigation />
        <ExecutiveSummary
          report={report}
          selected={selected}
          onSelect={setSelectedKey}
        />
        <GapComparison
          dimensions={report.dimensions}
          selected={selected}
          onSelect={setSelectedKey}
          onPrioritize={prioritize}
        />
        <ActionPlan
          report={report}
          selected={selected}
          onSelect={setSelectedKey}
        />
      </main>
      <footer className="app-footer">
        <div className="section-shell">
          <p>
            Data ini adalah awal percakapan, bukan kesimpulan tunggal tentang
            lembaga.
          </p>
          <span>{report.reportId}</span>
        </div>
      </footer>
    </>
  );
}
