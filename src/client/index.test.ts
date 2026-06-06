import { describe, expect, it } from "vitest";

import * as analytics from "./index";

const unsafeComponentDbExports = [
  "aggregateEvent",
  "collectDailyMetricRows",
  "getMetricTotalForRange",
  "incrementDailyMetric",
  "prepareTrackEvent",
  "upsertMetricRollupForEvent",
  "writeAnalyticsEvent",
  "buildAggregateInput",
  "buildAnalyticsEventInsert",
  "buildIdempotencyKey",
  "getMetricRollupIncrements",
  "getRollupIncrementKey",
  "getTopSeriesKeys",
  "hashString",
  "listDailyBuckets",
  "toAggregateInput",
  "getAnalyticsMetricTotalsByDimension",
  "getAnalyticsTopDimensionValue",
] as const;

describe("package root exports", () => {
  it("does not expose direct component-db helpers to app code", () => {
    for (const exportName of unsafeComponentDbExports) {
      expect(analytics).not.toHaveProperty(exportName);
    }
  });

  it("keeps safe public utilities available", () => {
    expect(analytics.defineAnalytics).toBeDefined();
    expect(analytics.createAnalyticsApi).toBeDefined();
    expect(analytics.getAnalyticsRanking).toBeDefined();
    expect(analytics.compareScores).toBeDefined();
  });
});
