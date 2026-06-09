// TYPES
import type {
	typesAnalyticsMetricScope,
	typesAnalyticsProperties,
} from "../../shared/types/index.js";

export function internalBuildIdempotencyKey(args: {
	name: string;
	occurredAt: number;
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
