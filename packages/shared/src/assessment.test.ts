import { describe, it, expect } from "vitest";
import { computeAssessment } from "./assessment";

describe("computeAssessment", () => {
  it("does not count Q30 (safety) in score", () => {
    const answers = Array.from({ length: 30 }, (_, i) => (i === 29 ? 3 : 0));
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(true);
    expect(r.overall).toBe(0);
  });

  it("does not flag safetyTriggered when no answers are high", () => {
    const answers = Array.from({ length: 30 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(false);
  });

  it("returns overall 0 for empty answers (not NaN)", () => {
    const r = computeAssessment([]);
    expect(r.overall).toBe(0);
    expect(r.safetyTriggered).toBe(false);
    expect(r.label).toBe("Butuh Dukungan");
    expect(r.primary).toBe("anxiety");
    expect(r.dimensions).toHaveLength(7);
  });

  it("returns primary issue = highest dimension", () => {
    const answers = Array.from({ length: 30 }, (_, i) =>
      i >= 10 && i <= 14 ? 3 : 0);
    const r = computeAssessment(answers);
    expect(r.primary).toBe("stress");
  });

  it("labels overall >=7 as Baik", () => {
    const answers = Array.from({ length: 30 }, () => 3);
    const r = computeAssessment(answers);
    expect(r.overall).toBeCloseTo(10, 0);
    expect(r.label).toBe("Baik");
  });

  it("labels overall <4 as Butuh Dukungan", () => {
    const answers = Array.from({ length: 30 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.label).toBe("Butuh Dukungan");
  });
});
