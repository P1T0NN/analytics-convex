/**
 * Test helpers for `@piton-/analytics-convex` consumers.
 *
 * Requires `convex-test` in your app devDependencies.
 *
 * @example
 * ```ts
 * import { convexTest } from "convex-test";
 * import modules from "../convex/_generated/api.js";
 * import {
 *   createAnalyticsComponentTest,
 *   runtimeConfiguration,
 *   analyticsConfigArgs,
 * } from "@piton-/analytics-convex/testing";
 * ```
 */

export {
	DAY_MS,
	internalAnalyticsConfigArgs as analyticsConfigArgs,
	internalCreateAnalyticsComponentTest as createAnalyticsComponentTest,
	internalPageViewsConfiguration as pageViewsConfiguration,
	internalRevenueConfiguration as revenueConfiguration,
	internalRuntimeConfiguration as runtimeConfiguration,
} from "../testUtils/componentTestUtils.js";

export {
	internalBuildVolumeEvents as buildVolumeEvents,
	internalLogVolumeTiming as logVolumeTiming,
	internalVolumeConfiguration as volumeConfiguration,
	VOLUME_EVENT_COUNTS,
	type typesVolumeTiming as VolumeTiming,
} from "../testUtils/volumeTestUtils.js";
