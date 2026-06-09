// UTILS
import { internalBuildIdempotencyKey } from "../utils/buildIdempotencyKey.js";
import {
	internalSanitizeProperties,
	internalValidateEventInput,
} from "../validations/validations.js";
import { internalValidateTrackEventLimits } from "../validations/eventInputLimits.js";
import { internalBadRequest } from "../errors/errors.js";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesPreparedTrackEventInput,
	typesTrackEventInput,
} from "../../shared/types/index.js";

export function internalPrepareTrackEvent(
	config: typesAnalyticsConfigState,
	input: typesTrackEventInput,
): typesPreparedTrackEventInput {
	const occurredAt = input.occurredAt ?? Date.now();
	const source = input.source ?? { type: "server" as const };
	const properties = internalSanitizeProperties(input.properties);

	internalValidateTrackEventLimits({
		...input,
		occurredAt,
		properties,
		source,
	});

	const errors = internalValidateEventInput(config, input.name, properties);
	if (errors.length > 0) {
		internalBadRequest(
			`[analytics] invalid event "${input.name}": ${errors.join(" ")}`,
		);
	}

	const idempotencyKey = internalBuildIdempotencyKey({
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
		...(input.unique ? { unique: input.unique } : {}),
	};
}
