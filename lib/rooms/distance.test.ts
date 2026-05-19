import { describe, it, expect } from "vitest";
import { haversineMeters } from "./distance";

describe("haversineMeters", () => {
  it("returns 0 for the same point", () => {
    expect(haversineMeters(-33.918, 151.231, -33.918, 151.231)).toBe(0);
  });

  it("returns ~111000m for one degree of latitude at the equator", () => {
    const d = haversineMeters(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it("matches a known UNSW distance (Ainsworth to Library is ~250m)", () => {
    // Ainsworth ~ (-33.9178, 151.2310)
    // Main library ~ (-33.9173, 151.2336)
    const d = haversineMeters(-33.9178, 151.231, -33.9173, 151.2336);
    expect(d).toBeGreaterThan(200);
    expect(d).toBeLessThan(350);
  });

  it("is symmetric", () => {
    const a = haversineMeters(-33.9, 151.2, -33.8, 151.3);
    const b = haversineMeters(-33.8, 151.3, -33.9, 151.2);
    expect(a).toBeCloseTo(b, 6);
  });
});
