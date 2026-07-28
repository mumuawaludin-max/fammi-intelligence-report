export type DimensionKey = "family" | "innovation" | "orientation" | "rules";

export type IconName =
  | "family"
  | "innovation"
  | "orientation"
  | "rules"
  | "target"
  | "award"
  | "institution"
  | "collaboration"
  | "quality";

export interface MeaningSignal {
  icon: IconName;
  title: string;
  detail: string;
}

export interface InterventionPhase {
  day: number;
  title: string;
  summary: string;
  actions: string[];
}

export interface SuccessIndicator {
  icon: IconName;
  title: string;
  detail: string;
}

export interface CultureDimension {
  key: DimensionKey;
  label: string;
  shortLabel: string;
  icon: IconName;
  current: number;
  target: number;
  gap: number;
  status: "Perlu perhatian" | "Ringan" | "Selaras";
  descriptor: string;
  interpretation: string;
  focus: string;
  priorityActions: string[];
  phases: InterventionPhase[];
  indicators: SuccessIndicator[];
  warnings: string[];
  targetImpact: string;
}

export interface SchoolCultureReport {
  reportId: string;
  schoolName: string;
  period: string;
  respondentCount: number;
  generatedAt: string;
  dominantDimension: DimensionKey;
  executiveSummary: string;
  meaningSignals: MeaningSignal[];
  dimensions: CultureDimension[];
  actionOwner: string;
  reviewCadence: string;
  targetDate: string;
  nextReview: string;
}
