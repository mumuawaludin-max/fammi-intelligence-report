import { ArrowRight, Medal, Sparkle, Target } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { IconBadge } from "./IconBadge";
import { Reveal } from "./Reveal";
import type { CultureDimension, DimensionKey } from "../types/report";

interface GapComparisonProps {
  dimensions: CultureDimension[];
  selected: CultureDimension;
  onSelect: (key: DimensionKey) => void;
  onPrioritize: (key: DimensionKey) => void;
}

const MIN_SCORE = 60;
const MAX_SCORE = 100;

export function GapComparison({
  dimensions,
  selected,
  onSelect,
  onPrioritize
}: GapComparisonProps) {
  const reduceMotion = useReducedMotion();
  const sorted = [...dimensions].sort((a, b) => gap(b) - gap(a));
  const largest = sorted[0];
  const closest = [...dimensions].sort((a, b) => gap(a) - gap(b))[0];

  return (
    <section className="section section--comparison" id="perbandingan">
      <div className="section-shell">
        <Reveal className="section-heading">
          <span className="section-index">01-B</span>
          <h2>Kondisi saat ini dan harapan ke depan</h2>
          <p>Bandingkan posisi keempat dimensi pada skala yang sama untuk menemukan prioritas intervensi.</p>
        </Reveal>

        <div className="comparison-layout">
          <Reveal className="comparison-chart" amount={0.1}>
            <div className="comparison-chart__header">
              <div>
                <h3>Perbandingan 4 dimensi</h3>
                <p>Nilai saat ini, harapan, dan besar gap.</p>
              </div>
              <div className="chart-legend" aria-label="Legenda grafik">
                <span><i className="legend-dot legend-dot--current" />Saat ini</span>
                <span><i className="legend-dot legend-dot--target" />Harapan</span>
              </div>
            </div>

            <div className="chart-scale" aria-hidden="true">
              <span>60%</span>
              <span>70%</span>
              <span>80%</span>
              <span>90%</span>
              <span>100%</span>
            </div>

            <div className="gap-rows">
              {dimensions.map((dimension, index) => {
                const active = selected.key === dimension.key;
                const start = scorePosition(dimension.current);
                const end = scorePosition(dimension.target);
                return (
                  <button
                    className={`gap-row ${active ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelect(dimension.key)}
                    key={dimension.key}
                  >
                    <span className="gap-row__label">
                      <IconBadge icon={dimension.icon} size="sm" />
                      <span>
                        <strong>{dimension.label}</strong>
                        <small>{dimension.descriptor}</small>
                      </span>
                    </span>

                    <span
                      className="dumbbell"
                      aria-label={`${dimension.label}: saat ini ${formatScore(dimension.current)}%, harapan ${formatScore(dimension.target)}%`}
                    >
                      <span className="dumbbell__grid" />
                      <motion.span
                        className="dumbbell__line"
                        style={{
                          left: `${start}%`,
                          width: `${Math.max(end - start, 1)}%`,
                          transformOrigin: "left"
                        }}
                        initial={reduceMotion ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.8 }}
                        transition={{ duration: 0.7, delay: index * 0.08 }}
                      />
                      <motion.span
                        className="dumbbell__point dumbbell__point--current"
                        style={{ left: `${start}%` }}
                        initial={reduceMotion ? false : { scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.2 + index * 0.08 }}
                      >
                        <em>{formatScore(dimension.current)}%</em>
                      </motion.span>
                      <motion.span
                        className="dumbbell__point dumbbell__point--target"
                        style={{ left: `${end}%` }}
                        initial={reduceMotion ? false : { scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.42 + index * 0.08 }}
                      >
                        <em>{formatScore(dimension.target)}%</em>
                      </motion.span>
                    </span>

                    <span className="gap-row__result">
                      <strong>{formatScore(gap(dimension))}%</strong>
                      <small className={`status status--${statusClass(dimension.status)}`}>
                        {dimension.status}
                      </small>
                    </span>
                    <ArrowRight weight="bold" className="gap-row__arrow" />
                  </button>
                );
              })}
            </div>

            <div className="chart-insight">
              <Sparkle weight="duotone" aria-hidden="true" />
              <p>
                <strong>{closest.label}</strong> paling dekat dengan harapan.{" "}
                <strong>{largest.label}</strong> memiliki gap terbesar dan memerlukan
                intervensi paling kuat.
              </p>
            </div>
          </Reveal>

          <Reveal className="priority-panel" delay={0.08} amount={0.1}>
            <div className="priority-panel__title">
              <IconBadge icon="award" size="sm" tone="gold" />
              <span>
                <strong>Prioritas eksekutif</strong>
                <small>Fokus pada dampak terbesar</small>
              </span>
            </div>

            <motion.div
              className="priority-panel__score"
              key={selected.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <IconBadge icon={selected.icon} size="lg" />
              <span>
                <small>Dimensi terpilih</small>
                <strong>{selected.label}</strong>
                <b>{formatScore(gap(selected))}% gap</b>
              </span>
            </motion.div>

            <div className="priority-panel__section">
              <h3>Interpretasi</h3>
              <p>{selected.interpretation}</p>
            </div>

            <div className="priority-panel__section">
              <h3>Arah fokus</h3>
              <ul className="focus-list">
                {selected.priorityActions.map((action) => (
                  <li key={action}>
                    <Target weight="duotone" aria-hidden="true" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className="button button--primary button--full"
              type="button"
              onClick={() => onPrioritize(selected.key)}
            >
              <Medal weight="duotone" />
              Jadikan prioritas intervensi
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function scorePosition(score: number) {
  return ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
}

function gap(dimension: CultureDimension) {
  return dimension.gap;
}

function formatScore(value: number) {
  return value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function statusClass(status: CultureDimension["status"]) {
  if (status === "Selaras") return "aligned";
  if (status === "Ringan") return "light";
  return "attention";
}
