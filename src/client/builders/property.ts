// TYPES
import type { typesAnalyticsPropertyType } from "../../shared/types/index.js";

export type typesAnalyticsPropertyDefinition<
	Type extends typesAnalyticsPropertyType = typesAnalyticsPropertyType,
	Required extends boolean = boolean,
> = {
	type: Type;
	required: Required;
};

function defineProperty<
	Type extends typesAnalyticsPropertyType,
	const Required extends boolean = false,
>(
	type: Type,
	options?: { required?: Required },
): typesAnalyticsPropertyDefinition<Type, Required> {
	return {
		type,
		required: (options?.required ?? false) as Required,
	};
}

export const property = {
	string: <const Required extends boolean = false>(options?: {
		required?: Required;
	}) => defineProperty("string", options),
	number: <const Required extends boolean = false>(options?: {
		required?: Required;
	}) => defineProperty("number", options),
	boolean: <const Required extends boolean = false>(options?: {
		required?: Required;
	}) => defineProperty("boolean", options),
};
