import { TRPCError } from "@trpc/server";
import { authedQuery } from "./middleware";

type Role = "candidate" | "mentor" | "expert" | "campus" | "admin" | "superadmin";

/** Procedure builder that requires the user to have one of the given roles. */
export function roleQuery(...roles: Role[]) {
  return authedQuery.use(async ({ ctx, next }) => {
    if (!roles.includes(ctx.user.role as Role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires role: ${roles.join(" or ")}`,
      });
    }
    if (!ctx.user.isActive) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Account disabled" });
    }
    return next({ ctx });
  });
}
