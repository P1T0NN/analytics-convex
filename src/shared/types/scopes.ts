export type typesAnalyticsScopeType = "global" | "organization" | "resource";

export type typesAnalyticsScopeInput =
	| {
			type: "global";
			id?: string;
	  }
	| {
			type: "organization";
			id: string;
	  }
	| {
			type: "resource";
			resourceType: string;
			id: string;
	  };

export type typesAnalyticsResolvedScope =
	| {
			type: "global";
			id: string;
	  }
	| {
			type: "organization";
			id: string;
	  }
	| {
			type: "resource";
			resourceType: string;
			resourceId: string;
			id: string;
	  };

/** Resolved scope alias used by component internals. */
export type typesAnalyticsScope = typesAnalyticsResolvedScope;

export type typesAnalyticsMetricScope = {
	scopeType: typesAnalyticsScopeType;
	scopeId: string;
};

export type typesAnalyticsResourceScope = {
	scopeType: "resource";
	scopeId: string;
};

export type typesAnalyticsResourceScopeInput = {
	type: "resource";
	resourceType: string;
	id: string;
};
