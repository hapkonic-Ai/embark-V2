import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { appRouter } from "../router";
import { getDb } from "../queries/connection";
import { users, mentorProfiles, mentorServices, type User } from "@db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "expert-services-test@embark.in";

async function getOrCreateTestExpert(): Promise<User> {
  const db = getDb();
  let user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, TEST_EMAIL),
  });

  if (!user) {
    const [result] = await db
      .insert(users)
      .values({
        unionId: `email:${TEST_EMAIL}`,
        name: "Test Expert",
        email: TEST_EMAIL,
        role: "expert",
        isActive: true,
      })
      .$returningId();
    user = (await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, result.id),
    }))!;
  }

  const existingProfile = await db.query.mentorProfiles.findFirst({
    where: (p, { eq }) => eq(p.userId, user!.id),
  });

  if (!existingProfile) {
    await db.insert(mentorProfiles).values({
      userId: user!.id,
      publicSlug: "test-expert",
      displayName: "Test Expert",
      status: "active",
      onboardingStatus: "completed",
      verificationStatus: "verified",
      isVerified: true,
      profileCompletionPercent: 100,
    });
  }

  return user! as User;
}

function callerFor(user: User) {
  return appRouter.createCaller({
    req: new Request("http://localhost/"),
    resHeaders: new Headers(),
    user,
  });
}

describe("expertServices router", () => {
  let expert: User;

  beforeAll(async () => {
    expert = await getOrCreateTestExpert();
  });

  afterEach(async () => {
    const db = getDb();
    await db.delete(mentorServices).where(eq(mentorServices.userId, expert.id));
  });

  it("creates a service as a draft with a generated slug and order", async () => {
    const caller = callerFor(expert);
    const result = await caller.expertServices.createService({
      title: "Resume Review",
      serviceType: "review",
      price: 999,
      durationMinutes: 30,
      description: "Detailed resume feedback.",
    });

    expect(result.success).toBe(true);
    expect(result.service.userId).toBe(expert.id);
    expect(result.service.status).toBe("draft");
    expect(result.service.slug).toMatch(/^resume-review/);
    expect(result.service.displayOrder).toBe(0);
  });

  it("lists only the current expert's services", async () => {
    const caller = callerFor(expert);
    await caller.expertServices.createService({
      title: "List Test Service",
      serviceType: "consultation",
      price: 1499,
    });

    const list = await caller.expertServices.listMyServices();
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("List Test Service");
  });

  it("fetches a service by id for the owner", async () => {
    const caller = callerFor(expert);
    const created = await caller.expertServices.createService({
      title: "Fetch Me",
      serviceType: "one_on_one",
      price: 2499,
    });

    const fetched = await caller.expertServices.getServiceById({ id: created.service.id });
    expect(fetched.id).toBe(created.service.id);
    expect(fetched.title).toBe("Fetch Me");
  });

  it("updates a service and regenerates the slug when requested", async () => {
    const caller = callerFor(expert);
    const created = await caller.expertServices.createService({
      title: "Old Title",
      serviceType: "mentorship",
      price: 3999,
    });

    const updated = await caller.expertServices.updateService({
      id: created.service.id,
      data: { title: "New Title", slug: "new-title" },
    });

    expect(updated.service.title).toBe("New Title");
    expect(updated.service.slug).toBe("new-title");
  });

  it("prevents publishing without a verified expert profile", async () => {
    const db = getDb();
    const unverifiedEmail = "unverified-expert-services@embark.in";
    let user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, unverifiedEmail),
    });

    if (!user) {
      const [result] = await db
        .insert(users)
        .values({
          unionId: `email:${unverifiedEmail}`,
          name: "Unverified Expert",
          email: unverifiedEmail,
          role: "expert",
          isActive: true,
        })
        .$returningId();
      user = (await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, result.id),
      }))!;
    }

    await db
      .insert(mentorProfiles)
      .values({
        userId: user.id,
        publicSlug: "unverified-expert",
        displayName: "Unverified Expert",
        status: "active",
        onboardingStatus: "completed",
        verificationStatus: "pending",
        isVerified: false,
        profileCompletionPercent: 100,
      })
      .onDuplicateKeyUpdate({
        set: { verificationStatus: "pending", isVerified: false },
      });

    const caller = appRouter.createCaller({
      req: new Request("http://localhost/"),
      resHeaders: new Headers(),
      user: user as User,
    });

    const created = await caller.expertServices.createService({
      title: "Unverified Service",
      serviceType: "review",
      price: 500,
      description: "This is a valid description for publish.",
    });

    await expect(
      caller.expertServices.publishService({ id: created.service.id }),
    ).rejects.toThrow(/must be verified before publishing/);
  });

  it("publishes a service when the expert profile is verified", async () => {
    const caller = callerFor(expert);
    const created = await caller.expertServices.createService({
      title: "Publishable Service",
      serviceType: "one_on_one",
      price: 1999,
      description: "A useful description for the service.",
    });

    const result = await caller.expertServices.publishService({ id: created.service.id });
    expect(result.success).toBe(true);
    expect(result.status).toBe("published");

    const fetched = await caller.expertServices.getServiceById({ id: created.service.id });
    expect(fetched.status).toBe("published");
  });

  it("unpublishes and archives a service", async () => {
    const caller = callerFor(expert);
    const created = await caller.expertServices.createService({
      title: "Lifecycle Service",
      serviceType: "consultation",
      price: 999,
    });

    const unpublished = await caller.expertServices.unpublishService({ id: created.service.id });
    expect(unpublished.status).toBe("unpublished");

    const archived = await caller.expertServices.archiveService({ id: created.service.id });
    expect(archived.status).toBe("archived");
  });

  it("reorders services", async () => {
    const caller = callerFor(expert);
    const a = await caller.expertServices.createService({
      title: "Service A",
      serviceType: "review",
      price: 100,
    });
    const b = await caller.expertServices.createService({
      title: "Service B",
      serviceType: "review",
      price: 200,
    });

    await caller.expertServices.reorderServices([
      { id: a.service.id, displayOrder: 5 },
      { id: b.service.id, displayOrder: 2 },
    ]);

    const list = await caller.expertServices.listMyServices();
    expect(list[0].id).toBe(b.service.id);
    expect(list[0].displayOrder).toBe(2);
    expect(list[1].id).toBe(a.service.id);
    expect(list[1].displayOrder).toBe(5);
  });

  it("forbids a non-owner from accessing or mutating a service", async () => {
    const db = getDb();
    const otherEmail = "other-expert-services@embark.in";
    let otherUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, otherEmail),
    });

    if (!otherUser) {
      const [result] = await db
        .insert(users)
        .values({
          unionId: `email:${otherEmail}`,
          name: "Other Expert",
          email: otherEmail,
          role: "expert",
          isActive: true,
        })
        .$returningId();
      otherUser = (await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, result.id),
      }))!;
    }

    const ownerCaller = callerFor(expert);
    const created = await ownerCaller.expertServices.createService({
      title: "Owner Service",
      serviceType: "review",
      price: 1000,
    });

    const otherCaller = callerFor(otherUser as User);
    await expect(otherCaller.expertServices.getServiceById({ id: created.service.id })).rejects.toThrow(
      /do not own this service/,
    );
    await expect(
      otherCaller.expertServices.updateService({ id: created.service.id, data: { price: 1 } }),
    ).rejects.toThrow(/do not own this service/);
  });
});
