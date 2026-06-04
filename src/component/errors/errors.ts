// LIBRARIES
import { ConvexError } from "convex/values";

export function badRequest(message: string): never {
    throw new ConvexError({ code: "BAD_REQUEST", message });
}

export function notConfigured(): never {
    throw new ConvexError({
        code: "NOT_CONFIGURED",
        message: "Analytics is not configured. Call the component configure mutation before tracking or querying."
    });
}
