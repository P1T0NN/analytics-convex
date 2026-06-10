import { ANALYTICS_LIMITS } from "../shared/constants.js";
import { internalRuntimeConfiguration } from "./componentTestUtils.js";

import type {
	typesAnalyticsTrafficMode,
} from "../shared/types/primitives.js";

export const VOLUME_EVENT_COUNTS = {
	lowVolume: 50,
	mediumVolume: ANALYTICS_LIMITS.maxTrackBatchSize,
	highVolume: ANALYTICS_LIMITS.maxTrackBatchSize,
} as const;

export function internalVolumeConfiguration(
	trafficMode: typesAnalyticsTrafficMode,
) {
	return internalRuntimeConfiguration({
		events: [
			{
				name: "event.tracked",
				label: "Event tracked",
				properties: { plan: "string" as const },
			},
		],
		metrics: [
			{
				name: "events",
				label: "Events",
				unit: "count" as const,
				eventNames: ["event.tracked"],
				aggregation: "count" as const,
				dimensions: ["plan"],
				trafficMode,
			},
		],
		settings: {
			trafficMode,
			mediumVolumeShardCount: 8,
			highVolumeShardCount: 32,
			highVolumeBatchSize: 250,
			highVolumeMaxCatchupBatches: 10,
		},
	});
}

export function internalBuildVolumeEvents(count: number, now: number) {
	return Array.from({ length: count }, (_, index) => ({
		name: "event.tracked" as const,
		occurredAt: now + index,
		properties: { plan: index % 2 === 0 ? "pro" : "free" },
		source: { type: "server" as const },
	}));
}

export type typesVolumeTiming = {
	mode: typesAnalyticsTrafficMode;
	eventCount: number;
	writeTrackMs: number;
	aggregateMs: number;
	queryMs: number;
	totalMs: number;
};

export function internalLogVolumeTiming(timing: typesVolumeTiming) {
	console.log(
		`[volume:${timing.mode}] events=${timing.eventCount} ` +
			`writeTrack=${timing.writeTrackMs.toFixed(1)}ms ` +
			`aggregate=${timing.aggregateMs.toFixed(1)}ms ` +
			`queries=${timing.queryMs.toFixed(1)}ms ` +
			`total=${timing.totalMs.toFixed(1)}ms`,
	);
}
