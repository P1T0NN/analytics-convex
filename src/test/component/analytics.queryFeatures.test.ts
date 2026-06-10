/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics query features", () => {
	it("aggregates daily rollups into weekly time series buckets", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const weekStart = Date.UTC(2026, 0, 5);
		const config = internalRuntimeConfiguration({
			events: [{ name: "order.completed", label: "Order completed" }],
			metrics: [
				{
					name: "orders",
					label: "Orders",
					unit: "count",
					eventNames: ["order.completed"],
					aggregation: "count",
				},
			],
		});

		const write = async (dayOffset: number, key: string) => {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "order.completed",
							occurredAt: weekStart + dayOffset * DAY_MS,
							properties: {},
							source: { type: "server" },
							idempotencyKey: key,
						},
					],
				},
			);
		};

		await write(0, "orders:0");
		await write(1, "orders:1");
		await write(2, "orders:2");

		const series = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "orders",
			from: weekStart,
			to: weekStart + 6 * DAY_MS,
			bucketUnit: "week",
		});

		expect(series.data).toHaveLength(1);
		expect(series.data[0]?.orders).toBe(3);
		expect(series.meta.bucketUnit).toBe("week");
	});

	it("breaks journey conversion down by plan", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayStart = startOfUtcDay(Date.UTC(2026, 1, 10));
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "checkout.started",
					label: "Checkout started",
					properties: { plan: "string" },
				},
				{
					name: "checkout.completed",
					label: "Checkout completed",
					properties: { plan: "string" },
				},
			],
			metrics: [
				{
					name: "checkoutsStarted",
					label: "Checkouts started",
					unit: "count",
					eventNames: ["checkout.started"],
					aggregation: "count",
				},
			],
			journeys: {
				checkout: {
					label: "Checkout journey",
					steps: ["checkout.started", "checkout.completed"],
					breakdownProperty: "plan",
				},
			},
		});

		const write = async (
			name: string,
			actorId: string,
			plan: string,
			offsetMs: number,
			key: string,
		) => {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name,
							actorId,
							occurredAt: dayStart + offsetMs,
							properties: { plan },
							source: { type: "server" },
							idempotencyKey: key,
						},
					],
				},
			);
		};

		await write("checkout.started", "pro-user", "pro", 1, "start:pro");
		await write("checkout.completed", "pro-user", "pro", 2, "done:pro");
		await write("checkout.started", "free-user", "free", 3, "start:free");

		const conversion = await t.query(api.lib.fetchJourneyConversion, {
			...internalAnalyticsConfigArgs(config),
			journey: "checkout",
			from: dayStart,
			to: dayStart,
			groupBy: "plan",
		});

		expect(conversion.breakdown).toEqual([
			{
				dimensionValue: "free",
				stepCounts: [1, 0],
				ratePercents: [null, 0],
			},
			{
				dimensionValue: "pro",
				stepCounts: [1, 1],
				ratePercents: [null, 100],
			},
		]);
	});

	it("breaks metric funnel conversion down by plan", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const from = startOfUtcDay(Date.UTC(2026, 2, 1));
		const to = startOfUtcDay(Date.UTC(2026, 2, 1));
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "checkout.started",
					label: "Checkout started",
					properties: { plan: "string" },
				},
				{
					name: "checkout.completed",
					label: "Checkout completed",
					properties: { plan: "string" },
				},
			],
			metrics: [
				{
					name: "started",
					label: "Started",
					unit: "count",
					eventNames: ["checkout.started"],
					aggregation: "count",
					dimensions: ["plan"],
				},
				{
					name: "completed",
					label: "Completed",
					unit: "count",
					eventNames: ["checkout.completed"],
					aggregation: "count",
					dimensions: ["plan"],
				},
			],
			funnels: {
				checkout: {
					label: "Checkout funnel",
					steps: ["started", "completed"],
				},
			},
		});

		const write = async (
			name: string,
			plan: string,
			key: string,
		) => {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name,
							occurredAt: from + 1,
							properties: { plan },
							source: { type: "server" },
							idempotencyKey: key,
						},
					],
				},
			);
		};

		await write("checkout.started", "pro", "start:pro");
		await write("checkout.completed", "pro", "done:pro");
		await write("checkout.started", "free", "start:free");

		const conversion = await t.query(api.lib.fetchFunnelConversion, {
			...internalAnalyticsConfigArgs(config),
			funnel: "checkout",
			from,
			to,
			groupBy: "plan",
		});

		expect(conversion.breakdown).toEqual([
			{
				dimensionValue: "free",
				numerator: 0,
				denominator: 1,
				ratePercent: 0,
			},
			{
				dimensionValue: "pro",
				numerator: 1,
				denominator: 1,
				ratePercent: 100,
			},
		]);
	});
});
