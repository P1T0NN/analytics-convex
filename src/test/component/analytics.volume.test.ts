/// <reference types="vite/client" />

import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
} from "../../testUtils/componentTestUtils";
import {
	internalBuildVolumeEvents,
	internalLogVolumeTiming,
	internalVolumeConfiguration,
	VOLUME_EVENT_COUNTS,
	type typesVolumeTiming,
} from "../../testUtils/volumeTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

const TRAFFIC_MODES = ["lowVolume", "mediumVolume", "highVolume"] as const;

async function internalDrainHighVolumePending(
	t: ReturnType<typeof internalCreateAnalyticsComponentTest>,
	configArgs: ReturnType<typeof internalAnalyticsConfigArgs>,
) {
	let totalProcessed = 0;

	while (true) {
		const result = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			configArgs,
		);
		totalProcessed += result.processed;
		if (result.processed === 0) {
			break;
		}
	}

	return totalProcessed;
}

describe("analytics volume harness", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it.each(TRAFFIC_MODES)(
		"tracks and queries %s traffic end-to-end",
		async (trafficMode) => {
			vi.useFakeTimers();
			const t = internalCreateAnalyticsComponentTest(modules);
			const now = Date.now();
			const eventCount = VOLUME_EVENT_COUNTS[trafficMode];
			const config = internalVolumeConfiguration(trafficMode);
			const configArgs = internalAnalyticsConfigArgs(config);
			const events = internalBuildVolumeEvents(eventCount, now);

			const totalStarted = performance.now();

			const writeStarted = performance.now();
			const scheduled = await t.mutation(api.lib.writeTrack, {
				...configArgs,
				events,
			});
			const writeTrackMs = performance.now() - writeStarted;

			expect(scheduled).toEqual({
				scheduled: true,
				scheduledCount: eventCount,
			});

			const aggregateStarted = performance.now();
			await t.finishAllScheduledFunctions(() => vi.runAllTimers());

			let processedPending = 0;
			if (trafficMode === "highVolume") {
				processedPending = await internalDrainHighVolumePending(t, configArgs);
				expect(processedPending).toBe(eventCount);
			}
			const aggregateMs = performance.now() - aggregateStarted;

			const queryStarted = performance.now();
			const [summary, timeSeries, breakdown] = await Promise.all([
				t.query(api.lib.fetchSummary, {
					...configArgs,
					metric: "events",
					from: now - DAY_MS,
					to: now + DAY_MS,
				}),
				t.query(api.lib.fetchTimeSeries, {
					...configArgs,
					metric: "events",
					from: now - DAY_MS,
					to: now + DAY_MS,
				}),
				t.query(api.lib.fetchBreakdown, {
					...configArgs,
					metric: "events",
					from: now - DAY_MS,
					to: now + DAY_MS,
					groupBy: "plan",
				}),
			]);
			const queryMs = performance.now() - queryStarted;
			const totalMs = performance.now() - totalStarted;

			expect(summary.value).toBe(eventCount);
			expect(timeSeries.data.length).toBeGreaterThan(0);
			expect(breakdown.data).toEqual(
				expect.arrayContaining([
					{ key: "pro", value: Math.ceil(eventCount / 2) },
					{ key: "free", value: Math.floor(eventCount / 2) },
				]),
			);

			const timing: typesVolumeTiming = {
				mode: trafficMode,
				eventCount,
				writeTrackMs,
				aggregateMs,
				queryMs,
				totalMs,
			};
			internalLogVolumeTiming(timing);
		},
	);
});
