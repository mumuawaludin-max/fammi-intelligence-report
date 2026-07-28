import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CaretDown,
  CaretUp,
  ChartDonut,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  Flag,
  HeartStraight,
  Info,
  Lightbulb,
  LockKey,
  Scales,
  ShieldCheck,
  Sparkle,
  Target,
  User,
  UsersThree,
  Warning
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type {
  AgencyLocus,
  IndividualCultureKey,
  IndividualReport as IndividualReportData,
  WellbeingSignal
} from "../types/individual";
import { Reveal } from "./Reveal";

interface IndividualReportProps {
  report: IndividualReportData;
  onBackToInstitution: () => void;
}

const signalIcons: Record<
  IndividualReportData["signals"][number]["key"],
  ComponentType<IconProps>
> = {
  strength: ShieldCheck,
  focus: Target,
  support: Flag
};

const cultureIcons: Record<IndividualCultureKey, ComponentType<IconProps>> = {
  family: UsersThree,
  innovation: Lightbulb,
  orientation: Target,
  rules: ClipboardText
};

const wellbeingIcons: Record<
  IndividualReportData["wellbeingDimensions"][number]["key"],
  ComponentType<IconProps>
> = {
  leadership: ShieldCheck,
  comfort: HeartStraight,
  growth: BookOpen,
  expectation: Flag,
  balance: Scales
};

const reflectionIcons: Record<
  IndividualReportData["reflections"][number]["key"],
  ComponentType<IconProps>
> = {
  energy: Sparkle,
  drain: Warning,
  change: Lightbulb
};

const roleIcons: Record<
  IndividualReportData["roleContribution"][number]["key"],
  ComponentType<IconProps>
> = {
  strategy: Target,
  priority: Flag,
  habit: ClipboardText
};

const signalLabel: Record<WellbeingSignal, string> = {
  strength: "Kekuatan",
  attention: "Perlu diamati",
  steady: "Cukup terjaga"
};

const locusLabel: Record<Exclude<AgencyLocus, "system">, string> = {
  control: "Dalam kendali saya",
  influence: "Bisa saya pengaruhi"
};

export function IndividualReport({
  report,
  onBackToInstitution
}: IndividualReportProps) {
  const reduceMotion = useReducedMotion();
  const [activeSignal, setActiveSignal] = useState(0);
  const [expandedCulture, setExpandedCulture] =
    useState<IndividualCultureKey>("rules");
  const [expandedWellbeing, setExpandedWellbeing] = useState(
    report.wellbeingDimensions.find((item) => item.signal === "attention")
      ?.key ?? report.wellbeingDimensions[0].key
  );
  const [showReflections, setShowReflections] = useState(false);
  const [expandedTerritory, setExpandedTerritory] =
    useState<AgencyLocus>("control");
  const [selectedActionId, setSelectedActionId] = useState(
    report.actions.find((action) => action.recommended)?.id ??
      report.actions[0].id
  );
  const selectedAction = useMemo(
    () =>
      report.actions.find((action) => action.id === selectedActionId) ??
      report.actions[0],
    [report.actions, selectedActionId]
  );
  const [firstStep, setFirstStep] = useState(selectedAction.defaults.firstStep);
  const [frequency, setFrequency] = useState(
    selectedAction.defaults.frequency
  );
  const [evidence, setEvidence] = useState(selectedAction.defaults.evidence);
  const [support, setSupport] = useState(selectedAction.defaults.support);
  const [committed, setCommitted] = useState(false);
  const [savedForLater, setSavedForLater] = useState(false);

  const chooseAction = (actionId: string) => {
    const next = report.actions.find((action) => action.id === actionId);
    if (!next) return;
    setSelectedActionId(actionId);
    setFirstStep(next.defaults.firstStep);
    setFrequency(next.defaults.frequency);
    setEvidence(next.defaults.evidence);
    setSupport(next.defaults.support);
    setCommitted(false);
    setSavedForLater(false);
  };

  const moveSignal = (direction: number) => {
    setActiveSignal((current) => {
      const total = report.signals.length;
      return (current + direction + total) % total;
    });
  };

  const signal = report.signals[activeSignal];
  const SignalIcon = signalIcons[signal.key];

  return (
    <div className="individual-stage">
      <article className="individual-report" id="individual-report-content">
        <header className="individual-header">
          <button
            className="individual-header__back"
            type="button"
            onClick={onBackToInstitution}
            aria-label="Kembali ke laporan lembaga"
          >
            <ArrowLeft weight="bold" />
          </button>
          <a
            className="individual-brand"
            href="#individual-report-content"
            aria-label="Fammi, kembali ke bagian atas laporan individu"
          >
            <span className="individual-brand__mark" aria-hidden="true">
              <ChartDonut weight="duotone" />
            </span>
            <span>Fammi</span>
          </a>
          <span className="individual-header__mode">Laporan Individu</span>
          <span className="individual-user" aria-label={`Pengguna ${report.salutation} ${report.personName}`}>
            <User weight="duotone" />
            <span>{report.salutation} {report.personName}</span>
          </span>
        </header>

        <main>
          <section className="individual-section individual-intro">
            <Reveal>
              <p className="individual-kicker">Laporan personal · {report.period}</p>
              <h1>
                Halo, {report.salutation} {report.personName}. Pilih kontribusi
                yang dapat Anda mulai.
              </h1>
              <p className="individual-not-score">
                Ini bukan nilai akhir tentang diri Anda.
              </p>
              <div className="individual-context">
                <span>{report.role}</span>
                <span>{report.unit}</span>
              </div>
            </Reveal>

            <Reveal className="personal-signal" delay={0.08}>
              <div className="personal-signal__topline">
                <span>Wawasan pribadi Anda</span>
                <span>{activeSignal + 1} / {report.signals.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  className="personal-signal__content"
                  key={signal.key}
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
                  transition={{ duration: 0.28 }}
                >
                  <span className="individual-icon individual-icon--large">
                    <SignalIcon weight="duotone" />
                  </span>
                  <p>{signal.eyebrow}</p>
                  <h2>{signal.value}</h2>
                  <p>{signal.detail}</p>
                </motion.div>
              </AnimatePresence>
              <div className="personal-signal__controls">
                <button
                  type="button"
                  onClick={() => moveSignal(-1)}
                  aria-label="Wawasan sebelumnya"
                >
                  <ArrowLeft weight="bold" />
                </button>
                <div className="personal-signal__dots" aria-hidden="true">
                  {report.signals.map((item, index) => (
                    <span
                      className={index === activeSignal ? "is-active" : ""}
                      key={item.key}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => moveSignal(1)}
                  aria-label="Wawasan berikutnya"
                >
                  <ArrowRight weight="bold" />
                </button>
              </div>
            </Reveal>

            <Reveal className="personal-aspiration" delay={0.12}>
              <Sparkle weight="duotone" />
              <div>
                <strong>Perubahan yang Anda harapkan</strong>
                <p>{report.aspiration}</p>
              </div>
            </Reveal>
          </section>

          <section className="individual-section individual-culture">
            <Reveal>
              <p className="individual-section__index">01 · Budaya yang Anda rasakan</p>
              <h2>Celah antara pengalaman dan harapan Anda</h2>
              <p>
                Bandingkan persepsi Anda dengan kondisi yang Anda harapkan.
                Semakin kecil jaraknya, semakin selaras.
              </p>
            </Reveal>

            <div className="individual-legend" aria-label="Legenda celah budaya">
              <span><i className="is-current" /> Persepsi Anda</span>
              <span><i className="is-target" /> Harapan Anda</span>
            </div>

            <div className="individual-gap-list">
              {report.cultureDimensions.map((dimension, index) => {
                const Icon = cultureIcons[dimension.key];
                const isExpanded = expandedCulture === dimension.key;
                return (
                  <Reveal delay={index * 0.04} key={dimension.key}>
                    <button
                      className={`individual-gap ${isExpanded ? "is-expanded" : ""}`}
                      type="button"
                      onClick={() => setExpandedCulture(dimension.key)}
                      aria-expanded={isExpanded}
                    >
                      <span className="individual-gap__heading">
                        <span className="individual-icon">
                          <Icon weight="duotone" />
                        </span>
                        <span>
                          <strong>{dimension.label}</strong>
                          <small>Gap {dimension.gap} poin</small>
                        </span>
                        {isExpanded ? <CaretUp /> : <CaretDown />}
                      </span>
                      <span className="individual-gap__values">
                        <span><strong>{dimension.current}%</strong> Saat ini</span>
                        <span><strong>{dimension.target}%</strong> Harapan</span>
                      </span>
                      <svg
                        className="individual-dumbbell"
                        viewBox="0 0 100 14"
                        role="img"
                        aria-label={`${dimension.label}: persepsi Anda ${dimension.current} persen, harapan ${dimension.target} persen, gap ${dimension.gap} poin`}
                      >
                        <line x1="0" y1="7" x2="100" y2="7" className="track" />
                        <motion.line
                          x1={dimension.current}
                          y1="7"
                          x2={dimension.target}
                          y2="7"
                          className="gap-line"
                          initial={reduceMotion ? false : { pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.62, delay: index * 0.06 }}
                        />
                        <circle cx={dimension.current} cy="7" r="4.5" className="current-dot" />
                        <circle cx={dimension.target} cy="7" r="4.5" className="target-dot" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.p
                          className="individual-gap__insight"
                          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        >
                          {dimension.interpretation}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </Reveal>
                );
              })}
            </div>

            <div className="individual-note">
              <Info weight="duotone" />
              <p>
                Gap tidak sepenuhnya menjadi tanggung jawab Anda. Bagian
                berikutnya membantu memisahkan kontribusi pribadi dari
                kebutuhan dukungan sistem.
              </p>
            </div>
          </section>

          <section className="individual-section individual-energy">
            <Reveal>
              <p className="individual-section__index">02 · Energi dan kesejahteraan</p>
              <h2>Apa yang menjaga dan menguras energi Anda</h2>
              <p>
                Spektrum ini menggambarkan pengalaman Anda, bukan penilaian
                kinerja.
              </p>
            </Reveal>

            <div className="individual-wellbeing-list">
              {report.wellbeingDimensions.map((dimension, index) => {
                const Icon = wellbeingIcons[dimension.key];
                const isExpanded = expandedWellbeing === dimension.key;
                return (
                  <Reveal delay={index * 0.035} key={dimension.key}>
                    <button
                      className={`individual-wellbeing ${isExpanded ? "is-expanded" : ""}`}
                      type="button"
                      onClick={() =>
                        setExpandedWellbeing(
                          isExpanded ? report.wellbeingDimensions[0].key : dimension.key
                        )
                      }
                      aria-expanded={isExpanded}
                    >
                      <span className="individual-icon">
                        <Icon weight="duotone" />
                      </span>
                      <span className="individual-wellbeing__body">
                        <span className="individual-wellbeing__heading">
                          <strong>{dimension.label}</strong>
                          <em className={`signal--${dimension.signal}`}>
                            {signalLabel[dimension.signal]}
                          </em>
                        </span>
                        <span className="individual-wellbeing__score">
                          {dimension.score}%
                        </span>
                        <svg
                          className="response-distribution"
                          viewBox="0 0 100 7"
                          role="img"
                          aria-label={`${dimension.distribution.positive} persen positif, ${dimension.distribution.neutral} persen netral, ${dimension.distribution.negative} persen negatif`}
                        >
                          <rect x="0" y="0" width={dimension.distribution.positive} height="7" className="positive" />
                          <rect
                            x={dimension.distribution.positive}
                            y="0"
                            width={dimension.distribution.neutral}
                            height="7"
                            className="neutral"
                          />
                          <rect
                            x={dimension.distribution.positive + dimension.distribution.neutral}
                            y="0"
                            width={dimension.distribution.negative}
                            height="7"
                            className="negative"
                          />
                        </svg>
                      </span>
                      {isExpanded ? <CaretUp /> : <CaretDown />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="individual-wellbeing__detail"
                          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        >
                          <p>{dimension.descriptor}</p>
                          <dl>
                            <div>
                              <dt>Respons Anda</dt>
                              <dd>{dimension.score}%</dd>
                            </div>
                            <div>
                              <dt>Gambaran lembaga</dt>
                              <dd>{dimension.organizationScore}%</dd>
                            </div>
                          </dl>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Reveal>
                );
              })}
            </div>
          </section>

          <section className="individual-section individual-role">
            <Reveal>
              <p className="individual-section__index">03 · Kontribusi peran</p>
              <h2>Hubungkan peran Anda dengan arah lembaga</h2>
              <p>{report.contributionInsight}</p>
            </Reveal>
            <div className="individual-role-path">
              {report.roleContribution.map((step, index) => {
                const Icon = roleIcons[step.key];
                return (
                  <Reveal delay={index * 0.08} key={step.key}>
                    <div className="individual-role-step">
                      <span className="individual-role-step__number">{index + 1}</span>
                      <span className="individual-icon">
                        <Icon weight="duotone" />
                      </span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <button
              className="individual-reflection-toggle"
              type="button"
              onClick={() => setShowReflections((value) => !value)}
              aria-expanded={showReflections}
            >
              <LockKey weight="duotone" />
              <span>
                <strong>Refleksi pribadi Anda</strong>
                <small>Hanya dapat dilihat oleh Anda</small>
              </span>
              {showReflections ? <CaretUp /> : <CaretDown />}
            </button>
            <AnimatePresence>
              {showReflections && (
                <motion.div
                  className="individual-reflections"
                  initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                >
                  {report.reflections.map((reflection) => {
                    const Icon = reflectionIcons[reflection.key];
                    return (
                      <article key={reflection.key}>
                        <Icon weight="duotone" />
                        <div>
                          <h3>{reflection.label}</h3>
                          <p>{reflection.summary}</p>
                          <details>
                            <summary>Lihat jawaban asli</summary>
                            <p>{reflection.originalAnswer}</p>
                          </details>
                        </div>
                      </article>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="individual-section individual-agency">
            <Reveal>
              <p className="individual-section__index">04 · Lingkar kontribusi</p>
              <h2>Mulai dari yang paling dekat dengan kendali Anda</h2>
              <p>
                Kontribusi Anda penting, tetapi perubahan tidak dibebankan
                kepada Anda sendiri.
              </p>
            </Reveal>

            <Reveal className="agency-orbit" delay={0.06}>
              <span className="agency-orbit__person"><User weight="fill" /></span>
              <span className="agency-orbit__ring agency-orbit__ring--one" />
              <span className="agency-orbit__ring agency-orbit__ring--two" />
              <span className="agency-orbit__ring agency-orbit__ring--three" />
              <span className="agency-orbit__number agency-orbit__number--one">1</span>
              <span className="agency-orbit__number agency-orbit__number--two">2</span>
              <span className="agency-orbit__number agency-orbit__number--three">3</span>
            </Reveal>

            <div className="agency-accordion">
              {report.agencyTerritories.map((territory, index) => {
                const isExpanded = expandedTerritory === territory.key;
                return (
                  <div
                    className={`agency-territory agency-territory--${territory.key} ${isExpanded ? "is-expanded" : ""}`}
                    key={territory.key}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTerritory(territory.key)}
                      aria-expanded={isExpanded}
                    >
                      <span className="agency-territory__number">{index + 1}</span>
                      <span>
                        <strong>{territory.title}</strong>
                        <small>{territory.description}</small>
                      </span>
                      <span className="agency-territory__count">
                        {territory.items.length}
                      </span>
                      {isExpanded ? <CaretUp /> : <CaretDown />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.ul
                          initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                        >
                          {territory.items.map((item) => (
                            <li key={item}>
                              <CheckCircle weight="duotone" />
                              {item}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="individual-note individual-note--gold">
              <Info weight="duotone" />
              <p>
                Momentum besar dibangun dari langkah kecil yang konsisten.
              </p>
            </div>
          </section>

          <section className="individual-section individual-action" id="individual-action">
            <Reveal>
              <p className="individual-section__index">05 · Komitmen 30 hari</p>
              <h2>Pilih satu perubahan kecil untuk 30 hari</h2>
              <p>
                Fokus pada tindakan yang bisa Anda kendalikan atau pengaruhi
                langsung.
              </p>
            </Reveal>

            <div className="individual-focus-reason">
              <Target weight="duotone" />
              <div>
                <span>Fokus yang disarankan</span>
                <strong>{report.focusArea}</strong>
                <p>{report.focusReason}</p>
              </div>
            </div>

            <fieldset className="individual-action-options">
              <legend>Pilih fokus Anda</legend>
              {report.actions.map((action) => {
                const isSelected = action.id === selectedActionId;
                return (
                  <label
                    className={`individual-action-option ${isSelected ? "is-selected" : ""}`}
                    key={action.id}
                  >
                    <input
                      type="radio"
                      name="individual-action"
                      value={action.id}
                      checked={isSelected}
                      onChange={() => chooseAction(action.id)}
                    />
                    <span className="individual-radio" aria-hidden="true" />
                    <span>
                      <strong>{action.title}</strong>
                      <small>{action.effort} · {locusLabel[action.locus]}</small>
                      <em>{action.rationale}</em>
                    </span>
                    {action.recommended && (
                      <span className="recommended-marker">
                        <Sparkle weight="fill" /> Disarankan
                      </span>
                    )}
                  </label>
                );
              })}
            </fieldset>

            <div className="individual-commitment-bar">
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  setCommitted(true);
                  setSavedForLater(false);
                }}
                disabled={!firstStep.trim() || !frequency || !evidence.trim()}
              >
                {committed ? (
                  <>
                    <CheckCircle weight="fill" /> Komitmen tersimpan
                  </>
                ) : (
                  <>
                    Saya memilih fokus ini <ArrowRight weight="bold" />
                  </>
                )}
              </button>
              <button
                type="button"
                className="individual-save-later"
                onClick={() => setSavedForLater(true)}
                aria-live="polite"
              >
                {savedForLater ? "Tersimpan untuk nanti" : "Simpan untuk nanti"}
              </button>
            </div>

            <div className="commitment-composer">
              <h3>Rancang komitmen Anda</h3>
              <p>Anda dapat menyesuaikan rekomendasi ini dengan konteks kerja.</p>

              <label>
                <span>Langkah pertama</span>
                <textarea
                  value={firstStep}
                  maxLength={180}
                  onChange={(event) => {
                    setFirstStep(event.target.value);
                    setCommitted(false);
                  }}
                />
                <small>{firstStep.length}/180</small>
              </label>
              <label>
                <span>Frekuensi</span>
                <select
                  value={frequency}
                  onChange={(event) => {
                    setFrequency(event.target.value);
                    setCommitted(false);
                  }}
                >
                  <option>Setiap Senin</option>
                  <option>Dua kali seminggu</option>
                  <option>Setiap dua minggu</option>
                  <option>Satu kali bulan ini</option>
                </select>
              </label>
              <label>
                <span>Bukti kemajuan</span>
                <textarea
                  value={evidence}
                  maxLength={180}
                  onChange={(event) => {
                    setEvidence(event.target.value);
                    setCommitted(false);
                  }}
                />
              </label>
              <label>
                <span>Dukungan yang saya perlukan</span>
                <textarea
                  value={support}
                  maxLength={180}
                  onChange={(event) => {
                    setSupport(event.target.value);
                    setCommitted(false);
                  }}
                />
              </label>
            </div>

            <div className="individual-checkins">
              <h3>Perjalanan 30 hari Anda</h3>
              {report.checkIns.map((checkIn) => (
                <article key={checkIn.id}>
                  <span>{checkIn.sequence}</span>
                  <div>
                    <strong>{checkIn.date}</strong>
                    <p>{checkIn.title}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="individual-privacy-note">
              <LockKey weight="duotone" />
              <p>Refleksi dan komitmen pribadi hanya dapat dilihat oleh Anda.</p>
            </div>

            <AnimatePresence>
              {committed && (
                <motion.div
                  className="commitment-success"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="status"
                >
                  <CheckCircle weight="fill" />
                  <div>
                    <strong>Komitmen 30 hari tersimpan</strong>
                    <p>Check-in pertama dijadwalkan pada {report.checkIns[0].date}.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>

        <footer className="individual-footer">
          <span>{report.reportId}</span>
          <button type="button" onClick={() => window.print()}>
            <DownloadSimple weight="bold" /> Unduh laporan
          </button>
        </footer>
      </article>
    </div>
  );
}
