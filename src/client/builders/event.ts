// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsPropertyType,
} from "../../shared/types/index.js";
import type { typesAnalyticsPropertyDefinition } from "./property";

type typesPropertyInput =
	| typesAnalyticsPropertyType
	| typesAnalyticsPropertyDefinition;

type typesPropertyInputs = Record<string, typesPropertyInput>;

type typesPropertyTypeFromInput<Input> =
	Input extends typesAnalyticsPropertyDefinition<infer Type, boolean>
		? Type
		: Input extends typesAnalyticsPropertyType
			? Input
			: never;

type typesPropertyConfigFromInputs<Properties extends typesPropertyInputs> = {
	[Key in keyof Properties]: typesPropertyTypeFromInput<Properties[Key]>;
};

type typesRequiredKeysFromInputs<Properties extends typesPropertyInputs> = {
	[Key in keyof Properties]: Properties[Key] extends typesAnalyticsPropertyDefinition<
		typesAnalyticsPropertyType,
		true
	>
		? Key
		: never;
}[keyof Properties] &
	string;

export type typesDefinedAnalyticsEventConfig<
	Name extends string,
	Properties extends typesPropertyInputs,
> = Omit<
	typesAnalyticsEventConfig<Name>,
	"properties" | "requiredProperties"
> & {
	properties: typesPropertyConfigFromInputs<Properties>;
	requiredProperties: readonly typesRequiredKeysFromInputs<Properties>[];
};

export function event<
	const Name extends string,
	const Properties extends typesPropertyInputs = Record<string, never>,
>(
	name: Name,
	options: {
		label: string;
		properties?: Properties;
	},
): typesDefinedAnalyticsEventConfig<Name, Properties> {
	const properties: Record<string, typesAnalyticsPropertyType> = {};
	const requiredProperties: string[] = [];

	for (const [key, value] of Object.entries(options.properties ?? {})) {
		if (typeof value === "string") {
			properties[key] = value;
			continue;
		}

		properties[key] = value.type;
		if (value.required) {
			requiredProperties.push(key);
		}
	}

	return {
		name,
		label: options.label,
		properties: properties as typesPropertyConfigFromInputs<Properties>,
		requiredProperties:
			requiredProperties as unknown as readonly typesRequiredKeysFromInputs<Properties>[],
	};
}
