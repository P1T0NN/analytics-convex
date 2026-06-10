import { describe, expect, it } from "vitest";

import * as testing from "../../testing/index";

describe("@piton-/analytics-convex/testing export", () => {
	it("exposes component test helpers with public names", () => {
		expect(testing.createAnalyticsComponentTest).toBeTypeOf("function");
		expect(testing.runtimeConfiguration).toBeTypeOf("function");
		expect(testing.analyticsConfigArgs).toBeTypeOf("function");
		expect(testing.pageViewsConfiguration).toBeTypeOf("function");
		expect(testing.revenueConfiguration).toBeTypeOf("function");
		expect(testing.volumeConfiguration).toBeTypeOf("function");
		expect(testing.buildVolumeEvents).toBeTypeOf("function");
		expect(testing.DAY_MS).toBeGreaterThan(0);
	});

	it("builds runtime config with a stable hash", () => {
		const config = testing.pageViewsConfiguration();
		expect(config.configHash).toEqual(expect.any(String));
		expect(testing.analyticsConfigArgs(config)).toEqual({
			configHash: config.configHash,
			config,
		});
	});
});
