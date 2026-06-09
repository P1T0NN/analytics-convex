// LIBRARIES
import { describe, expect, it } from "vitest";

// UTILS
import { internalSerializeEvents } from "../../../client/utils/serializeEvents";
import { internalSerializeMetrics } from "../../../client/utils/serializeMetrics";

describe("internalSerializeEvents", () => {
	it("serializes basic event fields", () => {
		const result = internalSerializeEvents([
			{ name: "page.viewed", label: "Page viewed" },
		]);
		expect(result).toEqual([{ name: "page.viewed", label: "Page viewed" }]);
	});

	it("includes properties when present", () => {
		const result = internalSerializeEvents([
			{
				name: "feature.used",
				label: "Feature used",
				properties: { feature: "string" },
			},
		]);
		expect(result[0].properties).toEqual({ feature: "string" });
	});

	it("includes requiredProperties when present", () => {
		const result = internalSerializeEvents([
			{
				name: "page.viewed",
				label: "Page viewed",
				requiredProperties: ["path"],
			},
		]);
		expect(result[0].requiredProperties).toEqual(["path"]);
	});
});

describe("internalSerializeMetrics", () => {
	it("serializes basic metric fields", () => {
		const result = internalSerializeMetrics([
			{
				name: "pageViews",
				label: "Page views",
				unit: "count",
				eventNames: ["page.viewed"],
				aggregation: "count",
			},
		]);
		expect(result[0]).toMatchObject({
			name: "pageViews",
			label: "Page views",
			unit: "count",
			eventNames: ["page.viewed"],
			aggregation: "count",
		});
	});

	it("includes optional fields", () => {
		const result = internalSerializeMetrics([
			{
				name: "revenue",
				label: "Revenue",
				description: "Total revenue",
				unit: "currency",
				eventNames: ["purchase.completed"],
				aggregation: "sum",
				valueProperty: "amount",
				dimensions: ["plan"],
				trafficMode: "highVolume",
				adminOnly: true,
			},
		]);
		expect(result[0]).toMatchObject({
			description: "Total revenue",
			valueProperty: "amount",
			dimensions: ["plan"],
			trafficMode: "highVolume",
			adminOnly: true,
		});
	});

	it("omits undefined optional fields", () => {
		const result = internalSerializeMetrics([
			{
				name: "pageViews",
				label: "Page views",
				unit: "count",
				eventNames: ["page.viewed"],
				aggregation: "count",
			},
		]);
		expect(result[0]).not.toHaveProperty("description");
		expect(result[0]).not.toHaveProperty("valueProperty");
		expect(result[0]).not.toHaveProperty("adminOnly");
	});
});
