// TYPES
import type {
	typesAnalyticsResourceScope,
	typesAnalyticsResourceScopeInput,
} from "../types/scopes.js";

import { ANALYTICS_SCOPE_SEPARATOR } from "../constants.js";

export function createAnalyticsScopeId(namespace: string, id: string) {
	return `${namespace}${ANALYTICS_SCOPE_SEPARATOR}${id}`;
}

export function createAnalyticsResourceScopeId(
	resourceType: string,
	resourceId: string,
) {
	return createAnalyticsScopeId(resourceType, resourceId);
}

export function createAnalyticsResourceScope(
	resourceType: string,
	resourceId: string,
): typesAnalyticsResourceScope {
	return {
		scopeType: "resource",
		scopeId: createAnalyticsResourceScopeId(resourceType, resourceId),
	};
}

export function createAnalyticsResourceScopeInput(
	resourceType: string,
	resourceId: string,
): typesAnalyticsResourceScopeInput {
	return {
		type: "resource",
		resourceType,
		id: resourceId,
	};
}
