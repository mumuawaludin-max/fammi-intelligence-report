import { motion } from "motion/react";
import { IconBadge } from "./IconBadge";
import { Reveal } from "./Reveal";
import { ScoreRing } from "./ScoreRing";
import type { CultureDimension, DimensionKey, SchoolCultureReport } from "../types/report";

interface ExecutiveSummaryProps {
  report: SchoolCultureReport;
  selected: CultureDimension;
  onSelect: (key: DimensionKey) => void;
}

export function ExecutiveSummary({
  report,
  selected,
  onSelect
}: ExecutiveSummaryProps) {
  const dominant = report.dimensions.find(
    (dimension) => dimension.key === report.dominantDimension
  )!;

  return (
    <section className="section section--summary" id="ringkasan">
      <div className="section-shell">
        <Reveal className="summary-hero">
          <div className="summary-hero__copy">
            <div className="section-kicker">
              <IconBadge icon="institution" size="sm" tone="plain" />
              <span>Laporan School Culture</span>
            </div>
            <h1>
              Ringkasan budaya
              <br />
              lembaga Anda
            </h1>
            <p className="lead">{report.executiveSummary}</p>
            <div className="dominant-callout">
              <IconBadge icon="award" size="md" />
              <span>Budaya dominan</span>
              <strong>{dominant.label}</strong>
            </div>
            <dl className="report-meta">
              <div>
                <dt>Periode</dt>
                <dd>{report.period}</dd>
              </div>
              <div>
                <dt>Responden</dt>
                <dd>{report.respondentCount} pegawai</dd>
              </div>
              <div>
                <dt>Diperbarui</dt>
                <dd>{report.generatedAt}</dd>
              </div>
            </dl>
          </div>

          <motion.div
            className="summary-hero__score"
            key={selected.key}
            initial={{ opacity: 0.35, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ScoreRing score={selected.current} label={`Skor ${selected.label}`} />
            <div className="score-context">
              <span className="score-context__eyebrow">Dimensi terpilih</span>
              <h2>{selected.label}</h2>
              <p>{selected.interpretation}</p>
              <span className={`status status--${statusClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>
          </motion.div>
        </Reveal>

        <Reveal className="dimension-selector" delay={0.08}>
          {report.dimensions.map((dimension) => {
            const active = selected.key === dimension.key;
            return (
              <button
                className={`dimension-card ${active ? "is-active" : ""}`}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(dimension.key)}
                key={dimension.key}
              >
                <IconBadge icon={dimension.icon} size="md" />
                <span>
                  <strong>{dimension.label}</strong>
                  <small>{dimension.shortLabel}</small>
                </span>
                <b>{formatScore(dimension.current)}%</b>
              </button>
            );
          })}
        </Reveal>

        <div className="meaning-block">
          <Reveal>
            <h2>Apa artinya bagi lembaga?</h2>
            <p>Orientasi hasil yang kuat perlu dijaga bersama kualitas relasi dan proses.</p>
          </Reveal>
          <div className="meaning-grid">
            {report.meaningSignals.map((signal, index) => (
              <Reveal
                className="meaning-item"
                delay={index * 0.06}
                amount={0.35}
                key={signal.title}
              >
                <IconBadge icon={signal.icon} size="md" tone={index === 4 ? "gold" : "purple"} />
                <div>
                  <h3>{signal.title}</h3>
                  <p>{signal.detail}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatScore(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function statusClass(status: CultureDimension["status"]) {
  if (status === "Selaras") return "aligned";
  if (status === "Ringan") return "light";
  return "attention";
}
