// LIBRARIES
import { v } from "convex/values";

export const propertyValueValidator = v.union(
	v.string(),
	v.number(),
	v.boolean(),
	v.null(),
);

export const sourceValidator = v.object({
	type: v.union(
		v.literal("server"),
		v.literal("client"),
		v.literal("webhook"),
		v.literal("system"),
	),
	name: v.optional(v.string()),
});

export const scopeValidator = v.object({
	scopeType: v.union(
		v.literal("global"),
		v.literal("organization"),
		v.literal("resource"),
	),
	scopeId: v.string(),
});

export const subjectValidator = v.object({
	type: v.string(),
	id: v.string(),
});

export const uniqueScopeValidator = v.literal("forever");

export const uniqueEventValidator = v.object({
	key: v.string(),
	scope: v.optional(uniqueScopeValidator),
});

export const scopeInputValidator = v.union(
	v.object({
		type: v.literal("global"),
		id: v.optional(v.string()),
	}),
	v.object({
		type: v.literal("organization"),
		id: v.string(),
	}),
	v.object({
		type: v.literal("resource"),
		resourceType: v.string(),
		id: v.string(),
	}),
);

export const trackEventInputFields = {
	occurredAt: v.optional(v.number()),
	actorId: v.optional(v.string()),
	organizationId: v.optional(v.string()),
	subject: v.optional(subjectValidator),
	scopes: v.optional(v.array(scopeValidator)),
	properties: v.optional(v.record(v.string(), propertyValueValidator)),
	source: v.optional(sourceValidator),
	unique: v.optional(uniqueEventValidator),
};

export const trackEventInputValidator = v.object({
	name: v.string(),
	...trackEventInputFields,
});
