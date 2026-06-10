/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import { HOUR_MS } from "../../shared/constants";
import {
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import { startOfUtcHour } from "../../shared/utils/analyticsDateRangeUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics hourly rollups", () => {
	it("stores and reads hourly metric buckets", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const hourStart = startOfUtcHour(Date.UTC(2026, 0, 15, 14, 30));
		const config = internalRuntimeConfiguration({
			events: [{ name: "feature.used", label: "Feature used" }],
			metrics: [
				{
					name: "featureUsesHourly",
					label: "Feature uses hourly",
					unit: "count",
					eventNames: ["feature.used"],
					aggregation: "count",
					rollupGranularity: "hour",
				},
			],
		});

		for (let index = 0; index < 3; index += 1) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "feature.used",
							occurredAt: hourStart + index * 1_000,
							properties: {},
							source: { type: "server" },
							idempotencyKey: `feature.used:hourly:${index}`,
						},
					],
				},
			);
		}

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "featureUsesHourly",
			from: hourStart,
			to: hourStart + HOUR_MS - 1,
		});

		expect(summary.value).toBe(3);

		const timeSeries = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "featureUsesHourly",
			from: hourStart,
			to: hourStart + 2 * HOUR_MS,
		});

		expect(timeSeries.data).toHaveLength(3);
		expect(timeSeries.data[0]?.featureUsesHourly).toBe(3);
		expect(timeSeries.data[1]?.featureUsesHourly).toBe(0);
	});
});
