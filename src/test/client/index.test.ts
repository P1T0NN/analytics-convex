import { describe, expect, it } from "vitest";

import * as analytics from "../../client/index";

const unsafeComponentDbExports = [
	"internalAggregateEvent",
	"internalCollectDailyMetricRows",
	"internalGetMetricTotalForRange",
	"internalIncrementDailyMetric",
	"internalPrepareTrackEvent",
	"internalUpsertMetricRollupForEvent",
	"internalWriteAnalyticsEvent",
	"internalBuildAggregateInput",
	"internalBuildAnalyticsEventInsert",
	"internalBuildIdempotencyKey",
	"internalClaimUniqueEvent",
	"internalGetMetricRollupIncrements",
	"internalGetRollupIncrementKey",
	"internalGetTopSeriesKeys",
	"internalHashString",
	"internalListDailyBuckets",
	"internalToAggregateInput",
	"internalGetAnalyticsMetricTotalsByDimension",
	"internalGetAnalyticsTopDimensionValue",
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
		expect(analytics.trackAnalytics).toBeDefined();
		expect(analytics.getAnalyticsRanking).toBeDefined();
		expect(analytics.compareScores).toBeDefined();
		expect(analytics.evaluateMetricLabel).toBeDefined();
		expect(analytics.computePercentOfGoal).toBeDefined();
		expect(analytics.ANALYTICS_METRIC_LABELS).toBeDefined();
		expect(analytics.uniqueEventValidator).toBeDefined();
	});
});
