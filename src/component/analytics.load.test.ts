/// <reference types="vite/client" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";
import { ANALYTICS_LIMITS } from "../shared/analyticsLimits";

const modules = import.meta.glob("./**/*.*s");
const DAY_MS = 86_400_000;

describe("analytics load behavior", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("handles a full high-volume batch with stable totals", async () => {
		vi.useFakeTimers();
		const t = convexTest(schema, modules);
		const now = Date.now();

		await t.mutation(api.lib.writeConfiguration, {
			events: [
				{
					name: "purchase.completed",
					label: "Purchase completed",
					properties: { amount: "number", plan: "string" },
				},
			],
			metrics: [
				{
					name: "revenue",
					label: "Revenue",
					unit: "currency",
					eventNames: ["purchase.completed"],
					aggregation: "sum",
					valueProperty: "amount",
					dimensions: ["plan"],
					trafficMode: "highVolume",
				},
			],
			settings: {
				highVolumeBatchSize: ANALYTICS_LIMITS.maxTrackBatchSize,
			},
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

		const scheduled = await t.mutation(api.lib.writeTrackBatch, { events });
		expect(scheduled).toEqual({
			scheduled: true,
			scheduledCount: ANALYTICS_LIMITS.maxTrackBatchSize,
		});

		await t.finishAllScheduledFunctions(() => vi.runAllTimers());

		const processed = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			{},
		);
		expect(processed.processed).toBe(ANALYTICS_LIMITS.maxTrackBatchSize);

		const summary = await t.query(api.lib.fetchSummary, {
			metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(ANALYTICS_LIMITS.maxTrackBatchSize);

		const breakdown = await t.query(api.lib.fetchBreakdown, {
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
