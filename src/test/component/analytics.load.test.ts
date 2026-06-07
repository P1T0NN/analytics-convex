/// <reference types="vite/client" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../component/_generated/api";
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits";
import {
	DAY_MS,
	createAnalyticsComponentTest,
	revenueConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics load behavior", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("handles a full high-volume batch with stable totals", async () => {
		vi.useFakeTimers();
		const t = createAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = revenueConfiguration({
			highVolumeBatchSize: ANALYTICS_LIMITS.maxTrackBatchSize,
		});

		const events = Array.from(
			{ length: ANALYTICS_LIMITS.maxTrackBatchSize },
			(_, index) => ({
				name: "purchase.completed",
				occurredAt: now + index,
				properties: { amount: 1, plan: "pro" },
				source: { type: "server" as const },
			}),
		);

		const scheduled = await t.mutation(api.lib.writeTrack, { config, events });
		expect(scheduled).toEqual({
			scheduled: true,
			scheduledCount: ANALYTICS_LIMITS.maxTrackBatchSize,
		});

		await t.finishAllScheduledFunctions(() => vi.runAllTimers());

		const processed = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			{ config },
		);
		expect(processed.processed).toBe(ANALYTICS_LIMITS.maxTrackBatchSize);

		const summary = await t.query(api.lib.fetchSummary, {
			config,
			metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(ANALYTICS_LIMITS.maxTrackBatchSize);

		const breakdown = await t.query(api.lib.fetchBreakdown, {
			config,
			metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
			groupBy: "plan",
		});
		expect(breakdown.data).toEqual([
			{ key: "pro", value: ANALYTICS_LIMITS.maxTrackBatchSize },
		]);
	});
});
