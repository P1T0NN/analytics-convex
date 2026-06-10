/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics distinct actor metrics", () => {
	it("counts distinct actorId values once per day", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = internalRuntimeConfiguration({
			events: [{ name: "app.opened", label: "App opened" }],
			metrics: [
				{
					name: "dailyActiveUsers",
					label: "Daily active users",
					unit: "count",
					eventNames: ["app.opened"],
					aggregation: "distinctActors",
				},
			],
		});

		for (const [index, actorId] of ["user-a", "user-a", "user-b"].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "app.opened",
							occurredAt: now + index,
							actorId,
							properties: {},
							source: { type: "server" },
							idempotencyKey: `app.opened:${now}:${index}`,
						},
					],
				},
			);
		}

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "dailyActiveUsers",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(summary.value).toBe(2);
	});

	it("counts distinct actors across a multi-day range", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayOne = Date.UTC(2026, 0, 1, 12);
		const dayTwo = Date.UTC(2026, 0, 2, 12);
		const config = internalRuntimeConfiguration({
			events: [{ name: "app.opened", label: "App opened" }],
			metrics: [
				{
					name: "weeklyActiveUsers",
					label: "Weekly active users",
					unit: "count",
					eventNames: ["app.opened"],
					aggregation: "distinctActors",
				},
			],
		});

		for (const [index, payload] of [
			{ occurredAt: dayOne, actorId: "user-a" },
			{ occurredAt: dayOne + 1, actorId: "user-b" },
			{ occurredAt: dayTwo, actorId: "user-a" },
		].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "app.opened",
							occurredAt: payload.occurredAt,
							actorId: payload.actorId,
							properties: {},
							source: { type: "server" },
							idempotencyKey: `app.opened:weekly:${index}`,
						},
					],
				},
			);
		}

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "weeklyActiveUsers",
			from: dayOne,
			to: dayTwo + 86_400_000,
		});

		expect(summary.value).toBe(2);
	});

	it("returns daily distinct actor counts in time series", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayOne = Date.UTC(2026, 0, 1, 12);
		const dayTwo = Date.UTC(2026, 0, 2, 12);
		const config = internalRuntimeConfiguration({
			events: [{ name: "app.opened", label: "App opened" }],
			metrics: [
				{
					name: "dailyActiveUsers",
					label: "Daily active users",
					unit: "count",
					eventNames: ["app.opened"],
					aggregation: "distinctActors",
				},
			],
		});

		for (const [index, payload] of [
			{ occurredAt: dayOne, actorId: "user-a" },
			{ occurredAt: dayOne + 1, actorId: "user-b" },
			{ occurredAt: dayTwo, actorId: "user-a" },
		].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "app.opened",
							occurredAt: payload.occurredAt,
							actorId: payload.actorId,
							properties: {},
							source: { type: "server" },
							idempotencyKey: `app.opened:series:${index}`,
						},
					],
				},
			);
		}

		const result = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "dailyActiveUsers",
			from: dayOne,
			to: dayTwo + 86_400_000,
		});

		const dayOneStart = Date.UTC(2026, 0, 1);
		const dayTwoStart = Date.UTC(2026, 0, 2);

		expect(result.data.find((point) => point.date === dayOneStart)?.dailyActiveUsers).toBe(2);
		expect(result.data.find((point) => point.date === dayTwoStart)?.dailyActiveUsers).toBe(1);
	});
});
