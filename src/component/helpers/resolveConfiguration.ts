// LIBRARIES
import { ConvexError } from "convex/values";

// CONFIG
import {
	internalNormalizeConfig,
	internalTryGetCachedConfiguration,
} from "../analyticsConfig";

// UTILS
import { internalCreateConfigurationHash } from "../../shared/utils/configurationHashUtils.js";

// VALIDATIONS
import { internalValidateConfiguration } from "../validations/validations";

// TYPES
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsRuntimeConfig,
} from "../../shared/types/config.js";

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

async function internalLoadStoredConfiguration(
	ctx: typesConfigurationReadCtx,
	configHash: string,
) {
	return await ctx.db
		.query("analyticsConfigurations")
		.withIndex("by_hash", (q) => q.eq("hash", configHash))
		.first();
}

function internalConfigNotFound(): never {
	throw new ConvexError({
		code: "CONFIG_NOT_FOUND",
		message:
			"Analytics configuration was not found. Pass `config` on the first call or run writeConfiguration to register it.",
	});
}

/**
 * Resolve the analytics config for a read path.
 *
 * Order: in-memory cache by hash, then the stored config, then the inline
 * `config` payload. Queries never persist anything.
 */
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

	const stored = await internalLoadStoredConfiguration(ctx, args.configHash);
	if (stored) {
		return internalNormalizeResolvedConfig(
			args.configHash,
			stored.config as typesAnalyticsRuntimeConfig,
		);
	}

	if (!args.config) {
		internalConfigNotFound();
	}

	return internalNormalizeResolvedConfig(args.configHash, args.config);
}

/**
 * Resolve the analytics config for a write path, persisting it on first use.
 *
 * Always checks the database for the stored row — an in-memory cache hit
 * must not skip the insert, because follow-up calls that pass only
 * `configHash` (scheduled writes, crons) rely on the stored config.
 */
export async function internalEnsureConfiguration(
	ctx: typesConfigurationWriteCtx,
	args: {
		configHash: string;
		config?: typesAnalyticsRuntimeConfig;
	},
): Promise<typesAnalyticsConfigState> {
	const stored = await internalLoadStoredConfiguration(ctx, args.configHash);
	if (stored) {
		return (
			internalTryGetCachedConfiguration(args.configHash) ??
			internalNormalizeResolvedConfig(
				args.configHash,
				stored.config as typesAnalyticsRuntimeConfig,
			)
		);
	}

	if (!args.config) {
		internalConfigNotFound();
	}

	const expectedHash = internalCreateConfigurationHash({
		events: args.config.events,
		metrics: args.config.metrics,
		funnels: args.config.funnels ?? {},
		journeys: args.config.journeys ?? {},
		settings: args.config.settings,
	});

	if (expectedHash !== args.configHash) {
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
		journeys: args.config.journeys,
		settings: args.config.settings,
	});

	await ctx.db.insert("analyticsConfigurations", {
		hash: args.configHash,
		config: {
			events: args.config.events,
			metrics: args.config.metrics,
			...(args.config.funnels ? { funnels: args.config.funnels } : {}),
			...(args.config.journeys ? { journeys: args.config.journeys } : {}),
			settings: args.config.settings,
		},
		createdAt: Date.now(),
	});

	return internalNormalizeResolvedConfig(args.configHash, args.config);
}
