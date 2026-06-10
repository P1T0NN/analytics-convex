/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics metric aggregations", () => {
	it("aggregates avg, min, and max metrics in summary queries", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "order.completed",
					label: "Order completed",
					properties: { amount: "number" },
				},
			],
			metrics: [
				{
					name: "averageOrderValue",
					label: "Average order value",
					unit: "currency",
					eventNames: ["order.completed"],
					aggregation: "avg",
					valueProperty: "amount",
				},
				{
					name: "minimumOrderValue",
					label: "Minimum order value",
					unit: "currency",
					eventNames: ["order.completed"],
					aggregation: "min",
					valueProperty: "amount",
				},
				{
					name: "maximumOrderValue",
					label: "Maximum order value",
					unit: "currency",
					eventNames: ["order.completed"],
					aggregation: "max",
					valueProperty: "amount",
				},
			],
		});

		for (const [index, amount] of [10, 20, 30].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "order.completed",
							occurredAt: now + index,
							properties: { amount },
							source: { type: "server" },
							idempotencyKey: `order.completed:${now}:${index}`,
						},
					],
				},
			);
		}

		const range = {
			from: now - 86_400_000,
			to: now + 86_400_000,
		};

		const average = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "averageOrderValue",
			...range,
		});
		const minimum = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "minimumOrderValue",
			...range,
		});
		const maximum = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "maximumOrderValue",
			...range,
		});

		expect(average.value).toBe(20);
		expect(minimum.value).toBe(10);
		expect(maximum.value).toBe(30);
	});

	it("aggregates avg metrics across multiple days in time series", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayOne = Date.UTC(2026, 0, 1, 12);
		const dayTwo = Date.UTC(2026, 0, 2, 12);
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "latency.recorded",
					label: "Latency recorded",
					properties: { latencyMs: "number" },
				},
			],
			metrics: [
				{
					name: "averageLatency",
					label: "Average latency",
					unit: "count",
					eventNames: ["latency.recorded"],
					aggregation: "avg",
					valueProperty: "latencyMs",
				},
			],
		});

		for (const [index, payload] of [
			{ occurredAt: dayOne, latencyMs: 10 },
			{ occurredAt: dayTwo, latencyMs: 20 },
			{ occurredAt: dayTwo + 1, latencyMs: 40 },
		].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "latency.recorded",
							occurredAt: payload.occurredAt,
							properties: { latencyMs: payload.latencyMs },
							source: { type: "server" },
							idempotencyKey: `latency.recorded:${index}`,
						},
					],
				},
			);
		}

		const result = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "averageLatency",
			from: dayOne,
			to: dayTwo + 86_400_000,
		});

		const dayOneStart = Date.UTC(2026, 0, 1);
		const dayTwoStart = Date.UTC(2026, 0, 2);
		const dayOnePoint = result.data.find((point) => point.date === dayOneStart);
		const dayTwoPoint = result.data.find((point) => point.date === dayTwoStart);

		expect(dayOnePoint?.averageLatency).toBe(10);
		expect(dayTwoPoint?.averageLatency).toBe(30);
	});
});
