// CONSTANTS
import { GLOBAL_SCOPE_ID } from "../../constants.js";
import { createAnalyticsResourceScopeId } from "../../../shared/analyticsScopes.js";

// UTILS
import { badRequest } from "../../errors/errors.js";

// TYPES
import type {
  typesAnalyticsAggregateEventInput,
  typesAnalyticsMetricScope,
  typesAnalyticsScope,
  typesAnalyticsScopeInput,
} from "../../types/types.js";

export function createResourceScopeId(
  resourceType: string,
  resourceId: string,
) {
  return createAnalyticsResourceScopeId(resourceType, resourceId);
}

export function getScopesForEvent(
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
      scopeId: createResourceScopeId(event.subject.type, event.subject.id),
    });
  }

  scopes.push(...(event.scopes ?? []));
  return dedupeScopes(scopes);
}

export function getScopeKey(scope: typesAnalyticsMetricScope) {
  return `${scope.scopeType}:${scope.scopeId}`;
}

export function dedupeScopes(scopes: typesAnalyticsMetricScope[]) {
  const deduped = new Map<string, typesAnalyticsMetricScope>();

  for (const scope of scopes) {
    deduped.set(getScopeKey(scope), scope);
  }

  return [...deduped.values()];
}

export function resolveScope(
  scope: typesAnalyticsScopeInput | undefined,
): typesAnalyticsScope {
  if (!scope || scope.type === "global") {
    return { type: "global", id: scope?.id ?? GLOBAL_SCOPE_ID };
  }

  if (scope.type === "organization") {
    if (!scope.id) {
      badRequest("Organization analytics scope requires an id.");
    }

    return { type: "organization", id: scope.id };
  }

  if (!scope.resourceType || !scope.id) {
    badRequest("Resource analytics scope requires a resourceType and id.");
  }

  return {
    type: "resource",
    resourceType: scope.resourceType,
    resourceId: scope.id,
    id: createResourceScopeId(scope.resourceType, scope.id),
  };
}

export function toMetricScope(
  scope: typesAnalyticsScope,
): typesAnalyticsMetricScope {
  return {
    scopeType: scope.type,
    scopeId: scope.id,
  };
}
