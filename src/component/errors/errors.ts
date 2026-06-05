// LIBRARIES
import { ConvexError } from "convex/values";

export function badRequest(message: string): never {
  throw new ConvexError({ code: "BAD_REQUEST", message });
}

export function notConfigured(): never {
  throw new ConvexError({
    code: "NOT_CONFIGURED",
    message:
      "Analytics is not configured. Run your app's writeConfiguration function before tracking or querying, for example `bunx convex run analytics:writeConfiguration`.",
  });
}
