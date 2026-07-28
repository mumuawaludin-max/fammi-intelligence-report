import { motion, useReducedMotion } from "motion/react";

interface ScoreRingProps {
  score: number;
  label: string;
}

export function ScoreRing({ score, label }: ScoreRingProps) {
  const reduceMotion = useReducedMotion();
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring" role="img" aria-label={`${label}: ${score.toLocaleString("id-ID")}%`}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle className="score-ring__track" cx="110" cy="110" r={radius} />
        <motion.circle
          className="score-ring__value"
          cx="110"
          cy="110"
          r={radius}
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="score-ring__copy">
        <strong>{score.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
