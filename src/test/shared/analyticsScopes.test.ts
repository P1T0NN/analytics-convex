import { describe, expect, it } from "vitest";

import {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeId,
	createAnalyticsResourceScopeInput,
	createAnalyticsScopeId,
} from "../../shared/utils/analyticsScopesUtils";

describe("analytics scope helpers", () => {
	it("creates canonical compound scope ids", () => {
		expect(createAnalyticsScopeId("hospitalityOwner", "user_123")).toBe(
			"hospitalityOwner:user_123",
		);
	});

	it("creates canonical resource scope ids", () => {
		expect(createAnalyticsResourceScopeId("hospitalityOwner", "user_123")).toBe(
			"hospitalityOwner:user_123",
		);
	});

	it("creates tracking resource scopes", () => {
		expect(
			createAnalyticsResourceScope("hospitalityOwner", "user_123"),
		).toEqual({
			scopeType: "resource",
			scopeId: "hospitalityOwner:user_123",
		});
	});

	it("creates query resource scope inputs", () => {
		expect(
			createAnalyticsResourceScopeInput("hospitalityOwner", "user_123"),
		).toEqual({
			type: "resource",
			resourceType: "hospitalityOwner",
			id: "user_123",
		});
	});
});
