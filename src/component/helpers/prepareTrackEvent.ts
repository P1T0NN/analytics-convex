// UTILS
import { buildIdempotencyKey } from "../utils/buildIdempotencyKey.js";
import {
	sanitizeProperties,
	validateEventInput,
} from "../validations/validations.js";
import { validateTrackEventLimits } from "../validations/eventInputLimits.js";
import { badRequest } from "../errors/errors.js";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesPreparedTrackEventInput,
	typesTrackEventInput,
} from "../types/types.js";

export function prepareTrackEvent(
	config: typesAnalyticsConfigState,
	input: typesTrackEventInput,
): typesPreparedTrackEventInput {
	const occurredAt = input.occurredAt ?? Date.now();
	const source = input.source ?? { type: "server" as const };
	const properties = sanitizeProperties(input.properties);

	validateTrackEventLimits({
		...input,
		occurredAt,
		properties,
		source,
	});

	const errors = validateEventInput(config, input.name, properties);
	if (errors.length > 0) {
		badRequest(
			`[analytics] invalid event "${input.name}": ${errors.join(" ")}`,
		);
	}

	const idempotencyKey = buildIdempotencyKey({
		name: input.name,
		occurredAt,
		...(input.actorId ? { actorId: input.actorId } : {}),
		...(input.organizationId ? { organizationId: input.organizationId } : {}),
		...(input.subject ? { subject: input.subject } : {}),
		...(input.scopes ? { scopes: input.scopes } : {}),
		properties,
		source,
	});

	return {
		name: input.name,
		occurredAt,
		actorId: input.actorId,
		organizationId: input.organizationId,
		subject: input.subject,
		scopes: input.scopes,
		properties,
		source,
		idempotencyKey,
	};
}
