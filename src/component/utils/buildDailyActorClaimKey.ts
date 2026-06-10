// TYPES
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";

export function internalBuildDailyActorClaimKey(args: {
	metric: string;
	bucketStart: number;
	scope: typesAnalyticsMetricScope;
	dimensionKey: string;
	dimensionValue: string;
	actorKey: string;
}) {
	return [
		args.metric,
		args.bucketStart,
		args.scope.scopeType,
		args.scope.scopeId,
		args.dimensionKey,
		args.dimensionValue,
		args.actorKey,
	].join(":");
}
