// TYPES
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";
import type {
	typesAnalyticsProperties,
} from "../../shared/types/primitives.js";

export function internalBuildIdempotencyKey(args: {
	name: string;
	occurredAt: number;
	/**
	 * Position of the event inside its track batch. Convex fixes `Date.now()`
	 * for the whole mutation, so without this two identical events in one
	 * batch would collide on the same key and silently collapse into one.
	 */
	batchIndex: number;
	actorId?: string;
	organizationId?: string;
	subject?: { type: string; id: string };
	scopes?: typesAnalyticsMetricScope[];
	properties: typesAnalyticsProperties;
	source?: { type: string; name?: string };
}) {
	const orderedProps = Object.keys(args.properties)
		.sort()
		.map((key) => `${key}=${JSON.stringify(args.properties[key])}`)
		.join(",");

	const source = args.source ?? { type: "server" };

	return [
		args.name,
		args.occurredAt,
		args.batchIndex,
		args.actorId ?? "",
		args.organizationId ?? "",
		args.subject?.type ?? "",
		args.subject?.id ?? "",
		...(args.scopes ?? [])
			.map((scope) => `${scope.scopeType}:${scope.scopeId}`)
			.sort(),
		source.type,
		source.name ?? "",
		orderedProps,
	].join("|");
}
