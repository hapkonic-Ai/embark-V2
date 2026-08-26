import { authRouter } from "./auth-router";
import { accountRouter } from "./routers/account";
import { catalogRouter } from "./routers/catalog";
import { candidateRouter } from "./routers/candidate";
import { mentorRouter } from "./routers/mentor";
import { adminRouter } from "./routers/admin";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  account: accountRouter,
  catalog: catalogRouter,
  candidate: candidateRouter,
  mentor: mentorRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
