export type Dimension =
  | "anxiety" | "mood" | "stress" | "trauma"
  | "sleep" | "relationship" | "self_esteem";

export const DIMENSIONS: Dimension[] = [
  "anxiety", "mood", "stress", "trauma",
  "sleep", "relationship", "self_esteem"
];

// questionNumber → dimension. Q10 = safety (not scored).
export const QUESTION_DIMENSION: Record<number, Dimension | "safety"> = {
  1:"anxiety", 2:"anxiety",
  3:"mood", 4:"mood",
  5:"stress", 6:"stress",
  7:"trauma",
  8:"sleep",
  9:"relationship",
  10:"safety"
};

export interface DimensionScore {
  dimension: Dimension;
  points: number;
  max: number;
  percent: number; // 0-100
}

export interface AssessmentResult {
  overall: number; // 0-10, 1 decimal
  label: "Baik" | "Perlu Perhatian" | "Butuh Dukungan";
  primary: Dimension;
  dimensions: DimensionScore[];
  safetyTriggered: boolean; // Q30 answer > 0
}

const clamp = (n: number) => Math.min(3, Math.max(0, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeAssessment(answers: number[]): AssessmentResult {
  const points: Record<Dimension, number> = {
    anxiety: 0, mood: 0, stress: 0, trauma: 0,
    sleep: 0, relationship: 0, self_esteem: 0
  };
  const counts: Record<Dimension, number> = {
    anxiety: 0, mood: 0, stress: 0, trauma: 0,
    sleep: 0, relationship: 0, self_esteem: 0
  };
  let safetyTriggered = false;

  answers.slice(0, 10).forEach((answer, i) => {
    const value = clamp(answer);
    const q = i + 1;
    const dimension = QUESTION_DIMENSION[q];
    if (dimension === "safety") {
      if (value > 0) safetyTriggered = true;
      return;
    }
    points[dimension] += value;
    counts[dimension] += 1;
  });

  const dimensions: DimensionScore[] = DIMENSIONS.map((dimension) => {
    const max = counts[dimension] * 3;
    const percent = max === 0 ? 0 : round1((points[dimension] / max) * 100);
    return { dimension, points: points[dimension], max, percent };
  });

  // Ties resolve to the first dimension in DIMENSIONS order.
  const primary = dimensions.reduce((a, b) =>
    b.percent > a.percent ? b : a).dimension;

  // Average only over scored dimensions (self_esteem has no questions in the mapping).
  const scored = dimensions.filter((d) => d.max > 0);
  const average = scored.length === 0
    ? 0
    : scored.reduce((sum, d) => sum + d.percent, 0) / scored.length;
  const overall = round1(average / 10);

  const label = overall >= 7 ? "Baik"
    : overall >= 4 ? "Perlu Perhatian"
    : "Butuh Dukungan";

  return { overall, label, primary, dimensions, safetyTriggered };
}
