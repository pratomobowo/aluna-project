import { describe, it, expect } from "vitest";
import { personalizationFor } from "./personalization";

describe("personalizationFor", () => {
  it("maps anxiety to 'Lebih Tenang & Seimbang'", () => {
    const p = personalizationFor("anxiety");
    expect(p.goal.label).toBe("Lebih Tenang & Seimbang");
    expect(p.roadmap.length).toBe(3);
    expect(p.dailyTaskPool.length).toBeGreaterThan(0);
  });
  it("every dimension has a goal", () => {
    for (const d of ["anxiety","mood","stress","trauma","sleep","relationship","self_esteem"] as const) {
      expect(personalizationFor(d).goal.label).toBeTruthy();
    }
  });
});
