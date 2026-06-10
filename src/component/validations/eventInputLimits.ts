// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/constants.js";

// VALIDATIONS
import {
	internalAssertAtMost,
	internalAssertFiniteNumber,
	internalAssertStringLength,
} from "./limitUtils.js";

// UTILS
import { internalBadRequest } from "../errors/errors.js";

// TYPES
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";
import type {
	typesAnalyticsProperties,
	typesAnalyticsPropertyValue,
} from "../../shared/types/primitives.js";

export function internalValidateTrackBatchLimits(count: number) {
	internalAssertAtMost(count, ANALYTICS_LIMITS.maxTrackBatchSize, "events");
}

export function internalValidateTrackEventLimits(args: {
	name: string;
	occurredAt: number;
	actorId?: string;
	organizationId?: string;
	subject?: { type: string; id: string };
	scopes?: typesAnalyticsMetricScope[];
	properties: typesAnalyticsProperties;
	source?: { type: string; name?: string };
	unique?: { key: string; scope?: "forever" };
}) {
	internalAssertStringLength(
		args.name,
		ANALYTICS_LIMITS.maxIdentifierLength,
		"event name",
	);
	internalAssertFiniteNumber(args.occurredAt, "occurredAt");

	if (args.actorId) {
		internalAssertStringLength(
			args.actorId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"actorId",
		);
	}
	if (args.organizationId) {
		internalAssertStringLength(
			args.organizationId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"organizationId",
		);
	}
	if (args.subject) {
		internalAssertStringLength(
			args.subject.type,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"subject.type",
		);
		internalAssertStringLength(
			args.subject.id,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"subject.id",
		);
	}
	if (args.source?.name) {
		internalAssertStringLength(
			args.source.name,
			ANALYTICS_LIMITS.maxSourceNameLength,
			"source.name",
		);
	}
	if (args.unique) {
		if (args.unique.key.trim().length === 0) {
			internalBadRequest("unique.key must not be empty.");
		}
		internalAssertStringLength(
			args.unique.key,
			ANALYTICS_LIMITS.maxUniqueKeyLength,
			"unique.key",
		);
		if (args.unique.scope && args.unique.scope !== "forever") {
			internalBadRequest('unique.scope must be "forever".');
		}
	}

	internalAssertAtMost(
		args.scopes?.length ?? 0,
		ANALYTICS_LIMITS.maxScopesPerEvent,
		"scopes",
	);
	for (const scope of args.scopes ?? []) {
		internalAssertStringLength(
			scope.scopeId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`scope "${scope.scopeType}"`,
		);
	}

	const entries = Object.entries(args.properties);
	internalAssertAtMost(
		entries.length,
		ANALYTICS_LIMITS.maxPropertiesPerEvent,
		"properties",
	);

	let payloadCharacters = 0;
	for (const [key, value] of entries) {
		internalAssertStringLength(
			key,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`property "${key}"`,
		);
		validatePropertyValueLimit(key, value);
		payloadCharacters += key.length + JSON.stringify(value).length;
	}

	if (payloadCharacters > ANALYTICS_LIMITS.maxPropertyPayloadCharacters) {
		internalBadRequest(
			`properties payload must be at most ${ANALYTICS_LIMITS.maxPropertyPayloadCharacters} characters.`,
		);
	}
}

function validatePropertyValueLimit(
	key: string,
	value: typesAnalyticsPropertyValue,
) {
	if (typeof value === "string") {
		internalAssertStringLength(
			value,
			ANALYTICS_LIMITS.maxPropertyStringLength,
			`property "${key}"`,
		);
	}
	if (typeof value === "number") {
		internalAssertFiniteNumber(value, `property "${key}"`);
	}
}
