import { describe, it, expect } from "vitest";
import { computeAssessment, SCORING_CONFIG } from "./assessment";

describe("computeAssessment", () => {
  it("does not count Q10 (safety) in score", () => {
    const answers = Array.from({ length: 10 }, (_, i) => (i === 9 ? 3 : 0));
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(true);
    expect(r.overall).toBe(0);
  });

  it("does not flag safetyTriggered when no answers are high", () => {
    const answers = Array.from({ length: 10 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(false);
  });

  it("returns overall 0 for empty answers (not NaN)", () => {
    const r = computeAssessment([]);
    expect(r.overall).toBe(0);
    expect(r.safetyTriggered).toBe(false);
    expect(r.label).toBe("Butuh Dukungan");
    expect(r.primary).toBe("anxiety");
    expect(r.dimensions).toHaveLength(SCORING_CONFIG.dimensionCount);
  });

  it("returns primary issue = highest dimension", () => {
    const answers = Array.from({ length: 10 }, (_, i) =>
      i >= 4 && i <= 5 ? 3 : 0);
    const r = computeAssessment(answers);
    expect(r.primary).toBe("stress");
  });

  it("labels overall >=7 as Baik", () => {
    const answers = Array.from({ length: 10 }, () => 3);
    const r = computeAssessment(answers);
    expect(r.overall).toBeCloseTo(10, 0);
    expect(r.label).toBe("Baik");
  });

  it("labels overall <4 as Butuh Dukungan", () => {
    const answers = Array.from({ length: 10 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.label).toBe("Butuh Dukungan");
  });

  it("uses SCORING_CONFIG thresholds", () => {
    const allMax = computeAssessment(Array.from({ length: 10 }, () => SCORING_CONFIG.scaleMax));
    expect(allMax.overall).toBeCloseTo(10, 0);
    expect(allMax.label).toBe("Baik");
  });
});
