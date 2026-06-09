// TYPES
import type { typesMetricRollupIncrement } from "../utils/getMetricRollupIncrements";

export function internalGetRollupIncrementKey(increment: typesMetricRollupIncrement) {
	return JSON.stringify([
		increment.metric,
		increment.bucketStart,
		increment.scope.scopeType,
		increment.scope.scopeId,
		increment.dimensionKey,
		increment.dimensionValue,
		increment.shard,
	]);
}
