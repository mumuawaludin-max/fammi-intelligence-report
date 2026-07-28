import {
  CalendarBlank,
  CheckCircle,
  Clock,
  DownloadSimple,
  Flag,
  ListChecks,
  User,
  Warning
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { IconBadge } from "./IconBadge";
import { Reveal } from "./Reveal";
import type { CultureDimension, DimensionKey, SchoolCultureReport } from "../types/report";

interface ActionPlanProps {
  report: SchoolCultureReport;
  selected: CultureDimension;
  onSelect: (key: DimensionKey) => void;
}

export function ActionPlan({ report, selected, onSelect }: ActionPlanProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="section section--action" id="tindak-lanjut">
      <div className="section-shell">
        <Reveal className="section-heading section-heading--center">
          <span className="section-index">01-C</span>
          <h2>Tindak lanjut yang perlu dilakukan</h2>
          <p>Pilih dimensi untuk melihat rencana intervensi dan indikator pemantauan yang relevan.</p>
        </Reveal>

        <Reveal className="action-tabs" delay={0.06}>
          {report.dimensions.map((dimension) => (
            <button
              className={selected.key === dimension.key ? "is-active" : ""}
              type="button"
              aria-pressed={selected.key === dimension.key}
              onClick={() => onSelect(dimension.key)}
              key={dimension.key}
            >
              <IconBadge
                icon={dimension.icon}
                size="sm"
                tone={selected.key === dimension.key ? "plain" : "purple"}
              />
              <span>{dimension.label}</span>
            </button>
          ))}
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            className="action-layout"
            key={selected.key}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="action-workspace">
              <div className="action-focus">
                <IconBadge icon={selected.icon} size="lg" />
                <div>
                  <h3>{selected.label}</h3>
                  <p><strong>Fokus utama:</strong> {selected.focus}</p>
                </div>
              </div>

              <div className="timeline-heading">
                <div>
                  <h3>Rencana intervensi 90 hari</h3>
                  <p>Tiga fase yang berurutan, terukur, dan mudah dipantau.</p>
                </div>
                <span>30 / 60 / 90 hari</span>
              </div>

              <div className="timeline">
                <motion.div
                  className="timeline__line"
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
                {selected.phases.map((phase, index) => (
                  <motion.article
                    className="phase"
                    initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.55, delay: index * 0.1 }}
                    key={phase.day}
                  >
                    <div className="phase__milestone">
                      <span>{phase.day}</span>
                      <small>hari</small>
                    </div>
                    <h4>{phase.title}</h4>
                    <p>{phase.summary}</p>
                    <ul>
                      {phase.actions.map((action) => (
                        <li key={action}>
                          <CheckCircle weight="duotone" aria-hidden="true" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                ))}
              </div>
            </div>

            <aside className="action-panel">
              <div className="action-panel__priority">
                <IconBadge icon="award" size="md" tone="gold" />
                <span>
                  <small>Status prioritas</small>
                  <strong>{selected.status === "Selaras" ? "Prioritas terjaga" : "Prioritas tinggi"}</strong>
                </span>
              </div>

              <dl className="action-meta">
                <div>
                  <User weight="duotone" />
                  <span>
                    <dt>Pemilik program</dt>
                    <dd>{report.actionOwner}</dd>
                  </span>
                </div>
                <div>
                  <CalendarBlank weight="duotone" />
                  <span>
                    <dt>Cadence</dt>
                    <dd>{report.reviewCadence}</dd>
                  </span>
                </div>
                <div>
                  <Flag weight="duotone" />
                  <span>
                    <dt>Target dampak</dt>
                    <dd>{selected.targetImpact}</dd>
                  </span>
                </div>
                <div>
                  <Clock weight="duotone" />
                  <span>
                    <dt>Target selesai</dt>
                    <dd>{report.targetDate}</dd>
                  </span>
                </div>
              </dl>

              <p className="action-panel__review">
                Tinjauan berikutnya <strong>{report.nextReview}</strong>
              </p>

              <button className="button button--primary button--full" type="button">
                <Flag weight="duotone" />
                Tetapkan sebagai prioritas
              </button>
              <button className="button button--outline button--full" type="button" onClick={() => window.print()}>
                <DownloadSimple weight="bold" />
                Unduh rencana tindakan
              </button>
            </aside>
          </motion.div>
        </AnimatePresence>

        <Reveal className="monitoring-band" amount={0.15}>
          <div className="monitoring-band__main">
            <div className="monitoring-band__heading">
              <ListChecks weight="duotone" aria-hidden="true" />
              <h3>Pemantauan dan indikator keberhasilan</h3>
            </div>
            <div className="indicator-grid">
              {selected.indicators.map((indicator) => (
                <article className="indicator" key={indicator.title}>
                  <IconBadge icon={indicator.icon} size="sm" />
                  <div>
                    <h4>{indicator.title}</h4>
                    <p>{indicator.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="warning-note">
            <Warning weight="duotone" aria-hidden="true" />
            <div>
              <h3>Hal yang perlu diwaspadai</h3>
              <ul>
                {selected.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
