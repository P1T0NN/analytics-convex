import { describe, expect, it } from "vitest";

// BUILDERS
import { event } from "./event";
import { count, sum } from "./metric";
import { property } from "./property";

describe("analytics builders", () => {
	it("builds event config from property helpers", () => {
		const productAdded = event("product.added", {
			label: "Product added",
			properties: {
				category: property.string({ required: true }),
				price: property.number(),
				inStock: property.boolean(),
			},
		});

		expect(productAdded).toEqual({
			name: "product.added",
			label: "Product added",
			properties: {
				category: "string",
				price: "number",
				inStock: "boolean",
			},
			requiredProperties: ["category"],
		});
	});

	it("builds count and sum metric config from metric helpers", () => {
		expect(
			count("Products added").from("product.added").by("category").build(
				"productsAdded",
			),
		).toEqual({
			name: "productsAdded",
			label: "Products added",
			unit: "count",
			eventNames: ["product.added"],
			aggregation: "count",
			dimensions: ["category"],
		});

		expect(
			sum("Product value added", "currency")
				.from("product.added")
				.value("price")
				.by("category", "currency")
				.build("productValueAdded"),
		).toEqual({
			name: "productValueAdded",
			label: "Product value added",
			unit: "currency",
			eventNames: ["product.added"],
			aggregation: "sum",
			valueProperty: "price",
			dimensions: ["category", "currency"],
		});
	});
});
