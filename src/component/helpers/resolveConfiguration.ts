// LIBRARIES
import { ConvexError } from "convex/values";

// CONFIG
import {
	internalNormalizeConfig,
	internalTryGetCachedConfiguration,
} from "../analyticsConfig";

// VALIDATIONS
import { internalValidateConfiguration } from "../validations/validations";

// TYPES
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
	typesAnalyticsRuntimeConfig,
} from "../../shared/types/index.js";

type typesConfigurationReadCtx = Pick<QueryCtx, "db">;
type typesConfigurationWriteCtx = Pick<MutationCtx, "db">;

function internalNormalizeResolvedConfig(
	configHash: string,
	config: typesAnalyticsRuntimeConfig,
) {
	return internalNormalizeConfig({
		...config,
		configHash,
	});
}

export async function internalResolveConfiguration(
	ctx: typesConfigurationReadCtx,
	args: {
		configHash: string;
		config?: typesAnalyticsRuntimeConfig;
	},
): Promise<typesAnalyticsConfigState> {
	const cached = internalTryGetCachedConfiguration(args.configHash);
	if (cached) {
		return cached;
	}

	const stored = await ctx.db
		.query("analyticsConfigurations")
		.withIndex("by_hash", (q) => q.eq("hash", args.configHash))
		.first();

	if (stored) {
		return internalNormalizeResolvedConfig(
			args.configHash,
			stored.config as typesAnalyticsRuntimeConfig,
		);
	}

	if (!args.config) {
		throw new ConvexError({
			code: "CONFIG_NOT_FOUND",
			message:
				"Analytics configuration was not found. Pass `config` on the first call or run writeConfiguration to register it.",
		});
	}

	return internalNormalizeResolvedConfig(args.configHash, args.config);
}

export async function internalEnsureConfiguration(
	ctx: typesConfigurationWriteCtx,
	args: {
		configHash: string;
		config?: typesAnalyticsRuntimeConfig;
	},
): Promise<typesAnalyticsConfigState> {
	const cached = internalTryGetCachedConfiguration(args.configHash);
	if (cached) {
		return cached;
	}

	const stored = await ctx.db
		.query("analyticsConfigurations")
		.withIndex("by_hash", (q) => q.eq("hash", args.configHash))
		.first();

	if (stored) {
		return internalNormalizeResolvedConfig(
			args.configHash,
			stored.config as typesAnalyticsRuntimeConfig,
		);
	}

	if (!args.config) {
		throw new ConvexError({
			code: "CONFIG_NOT_FOUND",
			message:
				"Analytics configuration was not found. Pass `config` on the first call or run writeConfiguration to register it.",
		});
	}

	const normalized = internalNormalizeResolvedConfig(
		args.configHash,
		args.config,
	);

	if (normalized.configHash !== args.configHash) {
		throw new ConvexError({
			code: "CONFIG_HASH_MISMATCH",
			message:
				"The provided configHash does not match the serialized analytics configuration.",
		});
	}

	internalValidateConfiguration({
		events: args.config.events,
		metrics: args.config.metrics,
		funnels: args.config.funnels,
		settings: args.config.settings,
	});

	await ctx.db.insert("analyticsConfigurations", {
		hash: args.configHash,
		config: {
			events: args.config.events,
			metrics: args.config.metrics,
			...(args.config.funnels ? { funnels: args.config.funnels } : {}),
			settings: args.config.settings,
		},
		createdAt: Date.now(),
	});

	return normalized;
}
