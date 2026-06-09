// UTILS
import { internalHashString } from "../hashString";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsMetricScope,
	typesAnalyticsSettings,
	typesAnalyticsTrafficMode,
} from "../../../shared/types/index.js";

export function internalGetMetricShard(
	event: typesAnalyticsAggregateEventInput,
	args: {
		metric: string;
		scope: typesAnalyticsMetricScope;
		dimensionKey: string;
		dimensionValue: string;
		shardCount: number;
	},
) {
	if (args.shardCount <= 1) return 0;

	return (
		internalHashString(
			[
				event.eventId,
				args.metric,
				args.scope.scopeType,
				args.scope.scopeId,
				args.dimensionKey,
				args.dimensionValue,
			].join(":"),
		) % args.shardCount
	);
}

export function internalGetShardCount(
	settings: typesAnalyticsSettings,
	mode: typesAnalyticsTrafficMode,
) {
	if (mode === "mediumVolume") return settings.mediumVolumeShardCount;
	if (mode === "highVolume") return settings.highVolumeShardCount;
	return 1;
}
