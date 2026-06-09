// CONSTANTS
import { GLOBAL_SCOPE_ID } from "../../../shared/constants.js";
import { createAnalyticsResourceScopeId } from "../../../shared/utils/analyticsScopesUtils.js";

// UTILS
import { internalBadRequest } from "../../errors/errors.js";

// TYPES
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsMetricScope,
	typesAnalyticsScope,
	typesAnalyticsScopeInput,
} from "../../../shared/types/index.js";

export function internalCreateResourceScopeId(
	resourceType: string,
	resourceId: string,
) {
	return createAnalyticsResourceScopeId(resourceType, resourceId);
}

export function internalGetScopesForEvent(
	event: typesAnalyticsAggregateEventInput,
): typesAnalyticsMetricScope[] {
	const scopes: typesAnalyticsMetricScope[] = [
		{ scopeType: "global", scopeId: GLOBAL_SCOPE_ID },
	];

	if (event.organizationId) {
		scopes.push({ scopeType: "organization", scopeId: event.organizationId });
	}

	if (event.subject) {
		scopes.push({
			scopeType: "resource",
			scopeId: internalCreateResourceScopeId(event.subject.type, event.subject.id),
		});
	}

	scopes.push(...(event.scopes ?? []));
	return internalDedupeScopes(scopes);
}

export function internalGetScopeKey(scope: typesAnalyticsMetricScope) {
	return `${scope.scopeType}:${scope.scopeId}`;
}

export function internalDedupeScopes(scopes: typesAnalyticsMetricScope[]) {
	const deduped = new Map<string, typesAnalyticsMetricScope>();

	for (const scope of scopes) {
		deduped.set(internalGetScopeKey(scope), scope);
	}

	return [...deduped.values()];
}

export function internalResolveScope(
	scope: typesAnalyticsScopeInput | undefined,
): typesAnalyticsScope {
	if (!scope || scope.type === "global") {
		return { type: "global", id: scope?.id ?? GLOBAL_SCOPE_ID };
	}

	if (scope.type === "organization") {
		if (!scope.id) {
			internalBadRequest("Organization analytics scope requires an id.");
		}

		return { type: "organization", id: scope.id };
	}

	if (!scope.resourceType || !scope.id) {
		internalBadRequest("Resource analytics scope requires a resourceType and id.");
	}

	return {
		type: "resource",
		resourceType: scope.resourceType,
		resourceId: scope.id,
		id: internalCreateResourceScopeId(scope.resourceType, scope.id),
	};
}

export function internalToMetricScope(
	scope: typesAnalyticsScope,
): typesAnalyticsMetricScope {
	return {
		scopeType: scope.type,
		scopeId: scope.id,
	};
}
