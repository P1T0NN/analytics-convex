// LIBRARIES
import { ConvexError } from "convex/values";

export function internalBadRequest(message: string): never {
	throw new ConvexError({ code: "BAD_REQUEST", message });
}
