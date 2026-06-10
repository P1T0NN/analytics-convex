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

describe("analytics journey funnels", () => {
	it("tracks ordered event steps per actor and day", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayStart = startOfUtcDay(Date.UTC(2026, 0, 10));
		const config = internalRuntimeConfiguration({
			events: [
				{ name: "signup.started", label: "Signup started" },
				{ name: "signup.completed", label: "Signup completed" },
				{ name: "onboarding.finished", label: "Onboarding finished" },
			],
			metrics: [
				{
					name: "signupsStarted",
					label: "Signups started",
					unit: "count",
					eventNames: ["signup.started"],
					aggregation: "count",
				},
			],
			journeys: {
				signup: {
					label: "Signup journey",
					steps: ["signup.started", "signup.completed", "onboarding.finished"],
				},
			},
		});

		const write = async (
			name: string,
			actorId: string,
			offsetMs: number,
			idempotencyKey: string,
		) => {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name,
							occurredAt: dayStart + offsetMs,
							actorId,
							properties: {},
							source: { type: "server" },
							idempotencyKey,
						},
					],
				},
			);
		};

		await write("signup.started", "user-a", 1, "signup.started:user-a");
		await write("signup.completed", "user-a", 2, "signup.completed:user-a");
		await write("onboarding.finished", "user-a", 3, "onboarding.finished:user-a");

		await write("signup.started", "user-b", 4, "signup.started:user-b");
		await write("signup.completed", "user-b", 5, "signup.completed:user-b");

		await write("signup.started", "user-c", 6, "signup.started:user-c");
		await write("onboarding.finished", "user-c", 7, "onboarding.finished:user-c");

		const conversion = await t.query(api.lib.fetchJourneyConversion, {
			...internalAnalyticsConfigArgs(config),
			journey: "signup",
			from: dayStart,
			to: dayStart,
		});

		expect(conversion.stepCounts).toEqual([3, 2, 1]);
		expect(conversion.ratePercents[1]).toBeCloseTo(66.666, 1);
		expect(conversion.ratePercents[2]).toBeCloseTo(33.333, 1);
	});

	it("purges stale journey claims with rollup retention", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const old = Date.now() - 10 * DAY_MS;
		const config = internalRuntimeConfiguration({
			events: [
				{ name: "signup.started", label: "Signup started" },
				{ name: "signup.completed", label: "Signup completed" },
			],
			metrics: [
				{
					name: "signupsStarted",
					label: "Signups started",
					unit: "count",
					eventNames: ["signup.started"],
					aggregation: "count",
				},
			],
			journeys: {
				signup: {
					label: "Signup journey",
					steps: ["signup.started", "signup.completed"],
				},
			},
			settings: {
				rollupRetentionDays: 7,
				maxRollupDeletesPerRun: 100,
			},
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "signup.started",
						occurredAt: old,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.started:old",
					},
					{
						name: "signup.completed",
						occurredAt: old + 1,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.completed:old",
					},
				],
			},
		);

		expect(
			await t.query(api.lib.fetchJourneyConversion, {
				...internalAnalyticsConfigArgs(config),
				journey: "signup",
				from: old - DAY_MS,
				to: old + DAY_MS,
			}),
		).toMatchObject({ stepCounts: [1, 1] });

		await t.mutation(api.lib.purgeStaleAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});

		expect(
			await t.query(api.lib.fetchJourneyConversion, {
				...internalAnalyticsConfigArgs(config),
				journey: "signup",
				from: old - DAY_MS,
				to: old + DAY_MS,
			}),
		).toMatchObject({ stepCounts: [0, 0] });
	});
});
