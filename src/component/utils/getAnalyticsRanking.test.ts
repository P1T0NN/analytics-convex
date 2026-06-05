// LIBRARIES
import { describe, expect, it } from "vitest";

// UTILS
import { compareScores } from "./compareScores";
import { getAnalyticsRanking } from "./getAnalyticsRanking";

describe("compareScores", () => {
  it("returns negative when a < b in ascending", () => {
    expect(compareScores("asc", 1, 2)).toBeLessThan(0);
  });

  it("returns positive when a > b in ascending", () => {
    expect(compareScores("asc", 2, 1)).toBeGreaterThan(0);
  });

  it("returns 0 when equal", () => {
    expect(compareScores("asc", 5, 5)).toBe(0);
    expect(compareScores("desc", 5, 5)).toBe(0);
  });

  it("returns positive when a < b in descending", () => {
    expect(compareScores("desc", 1, 2)).toBeGreaterThan(0);
  });

  it("returns negative when a > b in descending", () => {
    expect(compareScores("desc", 2, 1)).toBeLessThan(0);
  });
});

describe("getAnalyticsRanking", () => {
  const items = [
    { name: "a", score: 10 },
    { name: "b", score: 30 },
    { name: "c", score: 20 },
  ];

  it("sorts by score descending by default", () => {
    const result = getAnalyticsRanking({
      items,
      getScore: (item) => item.score,
    });
    expect(result.map((i) => i.name)).toEqual(["b", "c", "a"]);
  });

  it("sorts by score ascending when specified", () => {
    const result = getAnalyticsRanking({
      items,
      getScore: (item) => item.score,
      direction: "asc",
    });
    expect(result.map((i) => i.name)).toEqual(["a", "c", "b"]);
  });

  it("limits results", () => {
    const result = getAnalyticsRanking({
      items,
      getScore: (item) => item.score,
      limit: 2,
    });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("b");
  });

  it("handles empty array", () => {
    const result = getAnalyticsRanking({
      items: [],
      getScore: () => 0,
    });
    expect(result).toEqual([]);
  });

  it("uses tie-breakers when scores are equal", () => {
    const tied = [
      { name: "x", a: 10, b: 2 },
      { name: "y", a: 10, b: 5 },
      { name: "z", a: 10, b: 1 },
    ];
    const result = getAnalyticsRanking({
      items: tied,
      getScore: (item) => item.a,
      tieBreakers: [(a, b) => b.b - a.b],
    });
    expect(result.map((i) => i.name)).toEqual(["y", "x", "z"]);
  });
});
