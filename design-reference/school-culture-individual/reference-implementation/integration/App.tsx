import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ActionPlan } from "./components/ActionPlan";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { GapComparison } from "./components/GapComparison";
import { IndividualReport } from "./components/IndividualReport";
import { OrganizationReport } from "./components/OrganizationReport";
import { ReportHeader } from "./components/ReportHeader";
import {
  ReportNavigation,
  type ReportKey
} from "./components/ReportNavigation";
import { WellbeingReport } from "./components/WellbeingReport";
import { sampleOrganizationReport } from "./data/sampleOrganizationReport";
import { sampleIndividualReport } from "./data/sampleIndividualReport";
import { sampleReport } from "./data/sampleReport";
import { sampleWellbeingReport } from "./data/sampleWellbeingReport";
import type { DimensionKey, SchoolCultureReport } from "./types/report";
import type { IndividualReport as IndividualReportData } from "./types/individual";
import type { OrganizationReport as OrganizationReportData } from "./types/organization";
import type { WellbeingReport as WellbeingReportData } from "./types/wellbeing";

interface AppProps {
  report?: SchoolCultureReport;
  wellbeingReport?: WellbeingReportData;
  organizationReport?: OrganizationReportData;
  individualReport?: IndividualReportData;
}

export default function App({
  report = sampleReport,
  wellbeingReport = sampleWellbeingReport,
  organizationReport = sampleOrganizationReport,
  individualReport = sampleIndividualReport
}: AppProps) {
  const reduceMotion = useReducedMotion();
  const [reportMode, setReportMode] = useState<"institution" | "individual">(
    "institution"
  );
  const [activeReport, setActiveReport] = useState<ReportKey>("culture");
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

  const selectReport = (key: ReportKey) => {
    setActiveReport(key);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const activeReportId =
    reportMode === "individual"
      ? individualReport.reportId
      :
    activeReport === "culture"
      ? report.reportId
      : activeReport === "wellbeing"
        ? wellbeingReport.reportId
        : organizationReport.reportId;

  return (
    <>
      <a
        className="skip-link"
        href={
          reportMode === "individual"
            ? "#individual-report-content"
            : "#report-content"
        }
      >
        Lewati ke isi laporan
      </a>
      {reportMode === "institution" && (
        <ReportHeader
          schoolName={report.schoolName}
          onOpenIndividual={() => {
            setReportMode("individual");
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}
        />
      )}
      {reportMode === "institution" ? (
        <>
          <main id="report-top">
            <ReportNavigation
              activeReport={activeReport}
              onSelect={selectReport}
            />
            <div id="report-content">
          <AnimatePresence mode="wait">
            {activeReport === "culture" && (
              <motion.div
                key="culture"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              >
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
              </motion.div>
            )}
            {activeReport === "wellbeing" && (
              <WellbeingReport report={wellbeingReport} key="wellbeing" />
            )}
            {activeReport === "organization" && (
              <OrganizationReport
                report={organizationReport}
                key="organization"
              />
            )}
          </AnimatePresence>
            </div>
          </main>
          <footer className="app-footer">
            <div className="section-shell">
              <p>
                Data ini adalah awal percakapan, bukan kesimpulan tunggal tentang
                lembaga.
              </p>
              <span>{activeReportId}</span>
            </div>
          </footer>
        </>
      ) : (
        <IndividualReport
          report={individualReport}
          onBackToInstitution={() => {
            setReportMode("institution");
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
        />
      )}
    </>
  );
}
