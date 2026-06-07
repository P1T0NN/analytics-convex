// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits.js";

// VALIDATIONS
import {
	assertAtMost,
	assertFiniteNumber,
	assertStringLength,
} from "./limitUtils.js";

// UTILS
import { badRequest } from "../errors/errors.js";

// TYPES
import type {
	typesAnalyticsMetricScope,
	typesAnalyticsProperties,
	typesAnalyticsPropertyValue,
} from "../types/types.js";

export function validateTrackBatchLimits(count: number) {
	assertAtMost(count, ANALYTICS_LIMITS.maxTrackBatchSize, "events");
}

export function validateTrackEventLimits(args: {
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
	assertStringLength(
		args.name,
		ANALYTICS_LIMITS.maxIdentifierLength,
		"event name",
	);
	assertFiniteNumber(args.occurredAt, "occurredAt");

	if (args.actorId) {
		assertStringLength(
			args.actorId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"actorId",
		);
	}
	if (args.organizationId) {
		assertStringLength(
			args.organizationId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"organizationId",
		);
	}
	if (args.subject) {
		assertStringLength(
			args.subject.type,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"subject.type",
		);
		assertStringLength(
			args.subject.id,
			ANALYTICS_LIMITS.maxIdentifierLength,
			"subject.id",
		);
	}
	if (args.source?.name) {
		assertStringLength(
			args.source.name,
			ANALYTICS_LIMITS.maxSourceNameLength,
			"source.name",
		);
	}
	if (args.unique) {
		if (args.unique.key.trim().length === 0) {
			badRequest("unique.key must not be empty.");
		}
		assertStringLength(
			args.unique.key,
			ANALYTICS_LIMITS.maxUniqueKeyLength,
			"unique.key",
		);
		if (args.unique.scope && args.unique.scope !== "forever") {
			badRequest('unique.scope must be "forever".');
		}
	}

	assertAtMost(
		args.scopes?.length ?? 0,
		ANALYTICS_LIMITS.maxScopesPerEvent,
		"scopes",
	);
	for (const scope of args.scopes ?? []) {
		assertStringLength(
			scope.scopeId,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`scope "${scope.scopeType}"`,
		);
	}

	const entries = Object.entries(args.properties);
	assertAtMost(
		entries.length,
		ANALYTICS_LIMITS.maxPropertiesPerEvent,
		"properties",
	);

	let payloadCharacters = 0;
	for (const [key, value] of entries) {
		assertStringLength(
			key,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`property "${key}"`,
		);
		validatePropertyValueLimit(key, value);
		payloadCharacters += key.length + JSON.stringify(value).length;
	}

	if (payloadCharacters > ANALYTICS_LIMITS.maxPropertyPayloadCharacters) {
		badRequest(
			`properties payload must be at most ${ANALYTICS_LIMITS.maxPropertyPayloadCharacters} characters.`,
		);
	}
}

function validatePropertyValueLimit(
	key: string,
	value: typesAnalyticsPropertyValue,
) {
	if (typeof value === "string") {
		assertStringLength(
			value,
			ANALYTICS_LIMITS.maxPropertyStringLength,
			`property "${key}"`,
		);
	}
	if (typeof value === "number") {
		assertFiniteNumber(value, `property "${key}"`);
	}
}
