import { describe, expect, it } from "vitest";
import type { ComponentApi } from "../../../component/_generated/component";

// HELPERS
import { createAnalyticsTracker } from "../../../client/helpers/createAnalyticsTracker";
import { createAnalyticsConfiguration } from "../../../client/utils/createAnalyticsConfiguration";
import type {
	typesTypedTrackBatchInputForEvents,
	typesTypedTrackEventInputForEvents,
} from "../../../client/types/types";

describe("createAnalyticsTracker", () => {
	it("infers event-specific property types", () => {
		const component = {} as ComponentApi;
		const events = [
			{
				name: "product.added",
				label: "Product added",
				properties: {
					category: "string",
					price: "number",
					inStock: "boolean",
				},
				requiredProperties: ["category"],
			},
		] as const;

		const { track } = createAnalyticsTracker(
			component,
			events,
			createAnalyticsConfiguration(events, []),
		);

		type ProductAddedInput = Parameters<typeof track<"product.added">>[2];
		type ProductAddedEventInput = typesTypedTrackEventInputForEvents<
			typeof events
		>;
		type ProductAddedBatchInput = typesTypedTrackBatchInputForEvents<
			typeof events
		>;
		const validProperties: ProductAddedInput["properties"] = {
			category: "Shoes",
			price: 120,
			inStock: true,
		};
		const validInput: ProductAddedInput = {
			properties: validProperties,
		};

		const _invalidPrice: ProductAddedInput["properties"] = {
			category: "Shoes",
			// @ts-expect-error price must be a number.
			price: "120",
		};

		const _invalidProperty: ProductAddedInput["properties"] = {
			category: "Shoes",
			// @ts-expect-error unknown properties are not allowed.
			sku: "sku_123",
		};
		const validObjectInput: ProductAddedEventInput = {
			name: "product.added",
			properties: validProperties,
		};
		const validBatchInput: ProductAddedBatchInput = {
			events: [validObjectInput],
		};

		expect(track).toBeDefined();
		expect(validObjectInput.name).toBe("product.added");
		expect(validBatchInput.events).toHaveLength(1);
		expect(validInput.properties).toEqual({
			category: "Shoes",
			price: 120,
			inStock: true,
		});
	});
});
