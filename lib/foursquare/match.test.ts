import { describe, it, expect } from "vitest";
import { nameSimilarity } from "./match";

describe("nameSimilarity", () => {
  it("returns 1.0 for identical names", () => {
    expect(nameSimilarity("Ainsworth Building", "Ainsworth Building")).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(nameSimilarity("AINSWORTH building", "ainsworth Building")).toBe(1);
  });

  it("strips generic suffixes (building, centre, center, block, hall)", () => {
    expect(nameSimilarity("Ainsworth Building", "Ainsworth")).toBe(1);
    expect(nameSimilarity("Mathews Theatre", "Mathews Theatre Centre")).toBe(1);
    expect(nameSimilarity("Quad Block", "Quad")).toBe(1);
  });

  it("returns a partial score for one-word overlap in multi-word names", () => {
    const s = nameSimilarity("Red Centre East", "Red Centre West");
    expect(s).toBeGreaterThan(0.3);
    expect(s).toBeLessThan(1);
  });

  it("returns 0 for fully disjoint names", () => {
    expect(nameSimilarity("Ainsworth", "Goldstein")).toBe(0);
  });

  it("ignores extra whitespace and punctuation", () => {
    expect(nameSimilarity("  Ainsworth   Building  ", "Ainsworth-Building")).toBe(1);
  });
});
