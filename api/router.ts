import { authRouter } from "./auth-router";
import { accountRouter } from "./routers/account";
import { catalogRouter } from "./routers/catalog";
import { candidateRouter } from "./routers/candidate";
import { mentorRouter } from "./routers/mentor";
import { campusRouter } from "./routers/campus";
import { adminRouter } from "./routers/admin";
import { expertRouter } from "./routers/expert";
import { expertPageRouter } from "./routers/expert-page";
import { expertServicesRouter } from "./routers/expert-services";
import { expertServicePackagesRouter } from "./routers/expert-service-packages";
import { expertCalendarRouter } from "./routers/expert-calendar";
import { bookingRouter } from "./routers/booking";
import { paymentsRouter } from "./routers/payments";
import { expertOperationsRouter } from "./routers/expert-operations";
import { reviewsRouter } from "./routers/reviews";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  account: accountRouter,
  catalog: catalogRouter,
  candidate: candidateRouter,
  mentor: mentorRouter,
  campus: campusRouter,
  admin: adminRouter,
  expert: expertRouter,
  expertPage: expertPageRouter,
  expertServices: expertServicesRouter,
  expertServicePackages: expertServicePackagesRouter,
  expertCalendar: expertCalendarRouter,
  booking: bookingRouter,
  payments: paymentsRouter,
  expertOperations: expertOperationsRouter,
  reviews: reviewsRouter,
});

export type AppRouter = typeof appRouter;
