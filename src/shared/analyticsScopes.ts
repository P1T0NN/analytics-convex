export const ANALYTICS_SCOPE_SEPARATOR = ":";
export const ANALYTICS_RESOURCE_SCOPE_SEPARATOR = ANALYTICS_SCOPE_SEPARATOR;

export type typesAnalyticsResourceScope = {
  scopeType: "resource";
  scopeId: string;
};

export type typesAnalyticsResourceScopeInput = {
  type: "resource";
  resourceType: string;
  id: string;
};

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
