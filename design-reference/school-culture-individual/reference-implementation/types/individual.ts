export type AgencyLocus = "control" | "influence" | "system";

export type IndividualCultureKey =
  | "family"
  | "innovation"
  | "orientation"
  | "rules";

export type WellbeingSignal = "strength" | "attention" | "steady";

export interface IndividualSignal {
  key: "strength" | "focus" | "support";
  eyebrow: string;
  value: string;
  detail: string;
}

export interface IndividualCultureDimension {
  key: IndividualCultureKey;
  label: string;
  current: number;
  target: number;
  gap: number;
  interpretation: string;
}

export interface IndividualWellbeingDimension {
  key:
    | "leadership"
    | "comfort"
    | "growth"
    | "expectation"
    | "balance";
  label: string;
  score: number;
  organizationScore: number;
  descriptor: string;
  signal: WellbeingSignal;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface RoleContributionStep {
  key: "strategy" | "priority" | "habit";
  title: string;
  detail: string;
}

export interface PersonalReflection {
  key: "energy" | "drain" | "change";
  label: string;
  summary: string;
  originalAnswer: string;
}

export interface AgencyTerritory {
  key: AgencyLocus;
  title: string;
  description: string;
  items: string[];
}

export interface ActionDefaults {
  firstStep: string;
  frequency: string;
  evidence: string;
  support: string;
}

export interface IndividualActionOption {
  id: string;
  title: string;
  effort: string;
  locus: Exclude<AgencyLocus, "system">;
  recommended?: boolean;
  rationale: string;
  defaults: ActionDefaults;
}

export interface IndividualCheckIn {
  id: string;
  sequence: number;
  date: string;
  title: string;
}

export interface IndividualReport {
  reportId: string;
  personName: string;
  salutation: string;
  role: string;
  unit: string;
  schoolName: string;
  period: string;
  aspiration: string;
  signals: IndividualSignal[];
  cultureDimensions: IndividualCultureDimension[];
  wellbeingDimensions: IndividualWellbeingDimension[];
  contributionInsight: string;
  roleContribution: RoleContributionStep[];
  reflections: PersonalReflection[];
  agencyTerritories: AgencyTerritory[];
  focusArea: string;
  focusReason: string;
  actions: IndividualActionOption[];
  checkIns: IndividualCheckIn[];
}
