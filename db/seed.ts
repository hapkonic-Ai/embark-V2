import { scryptSync, randomBytes } from "node:crypto";
import { getDb } from "../api/queries/connection";
import {
  users,
  mentorProfiles,
  expertOnboarding,
  studentOnboarding,
  mentorships,
  mockSessions,
  orders,
  reviews,
  playbooks,
  playbookPurchases,
  events,
  submissions,
  guestLectureRequests,
  colleges,
} from "./schema";
import { saveBase64Asset, assetRef } from "../api/lib/file-assets";
import { sql } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const PASS = hashPassword("Arenafograds@123");

// Deterministic PRNG so every reseed produces the same demo data.
let seedState = 42;
function rnd() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function rndInt(min: number, max: number) {
  return min + Math.floor(rnd() * (max - min + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop",
];

const EVENT_COVERS = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop",
];

const FIRST = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Kabir",
  "Ananya", "Diya", "Aadhya", "Myra", "Sara", "Ira", "Priya", "Riya", "Anika", "Navya",
  "Aarohi", "Kiara", "Meera", "Anvi", "Avni",
];
const LAST = [
  "Sharma", "Verma", "Patel", "Mehta", "Shah", "Gupta", "Reddy", "Nair", "Iyer", "Khan",
  "Singh", "Chopra", "Joshi", "Desai", "Kulkarni", "Mukherjee", "Banerjee", "Das", "Chauhan", "Rathore",
  "Thakur", "Pillai", "Menon", "Rao", "Agarwal",
];

const BSCHOOLS = [
  "IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "XLRI Jamshedpur", "IIM Lucknow",
  "SPJIMR Mumbai", "IIM Kozhikode", "FMS Delhi", "MDI Gurgaon", "IIFT Delhi",
  "IIM Indore", "SIBM Pune", "NMIMS Mumbai", "IIM Trichy", "ISB Hyderabad",
  "IIM Udaipur", "IIM Ranchi", "IIM Raipur", "JBIMS Mumbai", "MICA Ahmedabad",
  "IMT Ghaziabad", "XIMB Bhubaneswar", "SCMHRD Pune", "IIM Shillong", "TAPMI Manipal",
];
const COMPANIES = [
  "McKinsey & Company", "Bain & Company", "Boston Consulting Group", "Hindustan Unilever", "Procter & Gamble",
  "Amazon", "Flipkart", "Google", "Microsoft", "Goldman Sachs",
  "JP Morgan", "Deloitte", "KPMG", "Accenture", "Titan",
  "Asian Paints", "Nestlé", "ITC", "Aditya Birla Group", "Reliance Industries",
  "Airtel", "Ola", "Swiggy", "Zomato", "Paytm",
];
const EXPERTISE = [
  "GD, PI, Consulting", "PI, HR Interview, SOP", "CAT Quant, DILR", "WAT, SOP, Profile Building",
  "GD, Current Affairs", "PI, Operations, Supply Chain", "Marketing, GD", "Finance, PI",
  "Strategy, Case Interviews", "HR, WAT",
];

const CAMPUS_COLLEGES = [
  "SJMSOM, IIT Bombay", "DoMS, IIT Delhi", "Department of Management, BITS Pilani",
  "Symbiosis Centre for Management Studies, Pune", "Christ University, Bengaluru",
  "St. Xavier's College, Kolkata", "Hansraj College, Delhi University", "Loyola College, Chennai",
  "St. Stephen's College, Delhi", "Fergusson College, Pune",
  "Presidency University, Kolkata", "Madras Christian College, Chennai", "Hindu College, Delhi",
  "Narsee Monjee College, Mumbai", "St. Joseph's College, Bengaluru",
  "Ashoka University, Sonipat", "FLAME University, Pune", "Shiv Nadar University, Noida",
  "Manipal Institute of Technology, Manipal", "VIT University, Vellore",
  "SRM Institute of Science and Technology, Chennai", "Thapar Institute, Patiala",
  "KIIT University, Bhubaneswar", "Amity University, Noida", "Chandigarh University, Mohali",
];

const REVIEW_TITLES = [
  "Insightful mock interviews", "Worth every rupee", "From waitlist to convert",
  "Brutal but brilliant feedback", "Structured GD prep", "Best decision of my prep",
];
const REVIEW_BODIES = [
  "The mocks felt harder than the real panel — exactly what I needed. My PI answers went from rambling to crisp in three sessions.",
  "Weekly GDs with instant debriefs changed how I structure arguments. Converted my first call.",
  "Personalised SOP review and honest profile feedback. The WhatsApp access between sessions was gold.",
  "Feedback was direct and actionable. Fixed my filler words and weak opening statements within two weeks.",
];
const SESSION_TOPICS = [
  "AI in Indian agriculture", "Cashless economy", "Work from home vs office", "EV adoption in India",
  "Startup valuation bubbles", "Gig economy workers' rights", "Privacy vs national security",
  "Renewable energy transition", "Tier-2 city startups", "Gen-Z workplace expectations",
];
const SESSION_FEEDBACK = [
  "Good structure — open with a framework next time. Avoid leading with data dumps.",
  "Strong content; work on eye contact and pace. Summarise in the last 30 seconds.",
  "Great energy. Counter-arguments need evidence — bring one stat per point.",
  "Well organised answer. Cut the jargon; the panel prefers plain language.",
];
const GUEST_TOPICS = [
  "Careers in management consulting", "Cracking CAT: a topper's playbook", "AI and the future of B-schools",
  "From campus to corporate: first 90 days", "Case competitions as a career lever",
  "Finance careers beyond investment banking", "Building a personal brand on LinkedIn",
  "Operations & supply chain careers", "Entrepreneurship right after B-school", "The art of the personal interview",
];
const SUBMISSION_TITLES = [
  "D2C Skincare: Path to Profitability", "Reviving Heritage Retail", "EV Charging Network Blueprint",
  "EdTech for Bharat 2.0", "Gig Worker Welfare Model", "Dairy Supply Chain Optimisation",
  "FinTech for Tier-3 India", "D2C Pet Care Playbook", "Campus Food Delivery Reboot",
];

function phoneFor(i: number, prefix: string) {
  return `+91 ${prefix}${String(20000000 + i * 1234567).slice(0, 8)}`;
}

async function resetData(db: ReturnType<typeof getDb>) {
  const tables = [
    "expert_notes",
    "expert_availability_exceptions",
    "expert_availability_rules",
    "payments",
    "orders",
    "sessions",
    "expert_bookings",
    "reviews",
    "mentor_service_package_items",
    "mentor_service_packages",
    "mentor_services",
    "expert_service_package_items",
    "expert_service_packages",
    "expert_services",
    "expert_page_sections",
    "expert_page_configs",
    "expert_pages",
    "expert_experience",
    "expert_education",
    "expert_resumes",
    "expert_verifications",
    "expert_onboarding",
    "student_onboarding",
    "guest_lecture_requests",
    "mock_sessions",
    "mentorships",
    "submissions",
    "playbook_purchases",
    "playbooks",
    "events",
    "file_assets",
    "mentor_profiles",
    "users",
  ];

  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
  for (const name of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE ${name}`));
    } catch (e) {
      console.warn(`truncate ${name} failed:`, (e as Error).message);
    }
  }
  await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
}

async function seed() {
  const db = getDb();
  console.log("Resetting and seeding Arena for grads demo data...");
  await resetData(db);
  console.log("tables reset");

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // ---------------------------------------------------------------- users
  const userIds: Record<string, number> = {};

  async function addUser(u: {
    name: string; email: string; role: "superadmin" | "admin" | "candidate" | "mentor" | "campus";
    phone?: string; linkedinUrl?: string;
  }) {
    const unionId = `email:${u.email}`;
    await db.insert(users).values({
      unionId,
      name: u.name,
      email: u.email,
      passwordHash: PASS,
      role: u.role,
      phone: u.phone,
      linkedinUrl: u.linkedinUrl,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    });
    const row = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.unionId, unionId) });
    userIds[u.email] = Number(row!.id);
  }

  await addUser({ name: "Super Admin", email: "superadmin@embark.in", role: "superadmin" });
  await addUser({ name: "Admin", email: "admin@embark.in", role: "admin" });

  const studentEmails: string[] = [];
  for (let i = 0; i < 25; i++) {
    const email = i === 0 ? "student@embark.in" : `${FIRST[i].toLowerCase()}.${LAST[i].toLowerCase()}${i}@seed.dev`;
    studentEmails.push(email);
    await addUser({
      name: `${FIRST[i]} ${LAST[i]}`,
      email,
      role: "candidate",
      phone: phoneFor(i, "98"),
      linkedinUrl: `https://linkedin.com/in/${FIRST[i].toLowerCase()}-${LAST[i].toLowerCase()}${i}`,
    });
  }

  const mentorEmails: string[] = [];
  for (let i = 0; i < 25; i++) {
    const email = i === 0 ? "mentor@embark.in" : `${FIRST[(i + 9) % 25].toLowerCase()}.${LAST[(i + 9) % 25].toLowerCase()}.m${i}@seed.dev`;
    mentorEmails.push(email);
    await addUser({
      name: `${FIRST[(i + 9) % 25]} ${LAST[(i + 9) % 25]}`,
      email,
      role: "mentor",
      phone: phoneFor(i, "97"),
      linkedinUrl: `https://linkedin.com/in/mentor-${FIRST[(i + 9) % 25].toLowerCase()}-${i}`,
    });
  }

  const campusEmails: string[] = [];
  for (let i = 0; i < 25; i++) {
    const email = i === 0 ? "campus@embark.in" : `campus${i}@seed.dev`;
    campusEmails.push(email);
    await addUser({
      name: `${CAMPUS_COLLEGES[i]} — Placement Cell`,
      email,
      role: "campus",
      phone: phoneFor(i, "96"),
    });
  }
  console.log("users done (2 admin + 25 students + 25 mentors + 25 campus)");

  // ---------------------------------------------------------- mentor profiles
  type MentorSeed = {
    userId: number; profileId: number; email: string; name: string;
    price: number; gdTotal: number; piTotal: number;
  };
  const mentorSeeds: MentorSeed[] = [];

  for (let i = 0; i < 25; i++) {
    const email = mentorEmails[i];
    const name = `${FIRST[(i + 9) % 25]} ${LAST[(i + 9) % 25]}`;
    const bschool = BSCHOOLS[i];
    const company = COMPANIES[i];
    const expertise = EXPERTISE[i % EXPERTISE.length];
    const yearsExp = 4 + (i % 10);
    const price = 4999 + (i % 8) * 2500;
    const mockGds = 3 + (i % 3);
    const mockPis = 3 + ((i + 1) % 4);
    const handle = email.split("@")[0].replace(/[^a-z0-9-]/g, "-");

    const res = await db.insert(mentorProfiles).values({
      userId: userIds[email],
      publicSlug: handle,
      displayName: name,
      headline: `${bschool} alum · ex-${company} · ${expertise.split(",")[0]} mentor`,
      bschool,
      company,
      expertise,
      yearsExp,
      price,
      mockGds,
      mockPis,
      bio: `${bschool} graduate with ${yearsExp} years at ${company}. Specialises in ${expertise.toLowerCase()}. Has guided 100+ aspirants through GD/PI rounds at top B-schools.`,
      whatsapp: phoneFor(i, "97"),
      linkedinUrl: `https://linkedin.com/in/mentor-${FIRST[(i + 9) % 25].toLowerCase()}-${i}`,
      isVerified: true,
      verificationStatus: "verified",
      status: "active",
      onboardingStatus: "completed",
      profileCompletionPercent: 100,
    }).$returningId();

    await db.insert(expertOnboarding).values({
      userId: userIds[email],
      currentStep: "verification",
      status: "completed",
      startedAt: new Date(now - 90 * day),
      completedAt: new Date(now - 85 * day),
      lastCompletedStep: "verification",
    });

    mentorSeeds.push({
      userId: userIds[email],
      profileId: res[0].id,
      email,
      name,
      price,
      gdTotal: mockGds,
      piTotal: mockPis,
    });
  }
  console.log("mentor profiles done");

  // ------------------------------------------------------- student onboarding
  for (let i = 0; i < 25; i++) {
    const withResume = i < 10;
    await db.insert(studentOnboarding).values({
      userId: userIds[studentEmails[i]],
      currentStep: "done",
      status: "completed",
      startedAt: new Date(now - 60 * day),
      completedAt: new Date(now - 55 * day),
      parsedData: withResume
        ? {
            headline: `MBA aspirant targeting ${BSCHOOLS[i % 25]}`,
            summary: `${FIRST[i]} is a final-year student preparing for CAT ${new Date().getFullYear()}, focusing on quant speed and PI storytelling.`,
            skills: ["Quantitative aptitude", "Public speaking", pick(["Excel", "Python", "Market research", "Financial modelling"])],
            education: [
              { institution: CAMPUS_COLLEGES[i], degree: "B.Com (Hons)", fieldOfStudy: "Commerce", startDate: "2021", endDate: "2024", grade: `${7 + (i % 3)}.${i % 10} CGPA` },
            ],
            experience: i % 2 === 0
              ? [{ company: pick(COMPANIES), role: "Summer Intern", startDate: "May 2023", endDate: "Jul 2023", isCurrent: false }]
              : [],
          }
        : null,
    });
  }
  console.log("student onboarding done");

  // ---------------------------------------------------------------- playbooks
  const adminId = userIds["admin@embark.in"];
  const playbookDefs = [
    { title: "Crack the GD", category: "GDPI", price: 499, pages: 68, description: "Frameworks, opening lines, 40 practice topics, and the exact etiquette panelists look for in group discussions." },
    { title: "Master the PI", category: "GDPI", price: 599, pages: 112, description: "200 actual interview questions from IIM/XLRI/FMS panels with model answer structures and traps to avoid." },
    { title: "Case Competition Bible", category: "Competitions", price: 899, pages: 94, description: "How to read a case, build a storyline, and present like a consultant — with 12 winning decks annotated." },
    { title: "Resume to Shortlist", category: "Profile", price: 299, pages: 45, description: "ATS-proof resume templates and bullet formulas that got 200+ candidates shortlist calls." },
    { title: "CAT Quant Sprint", category: "CAT", price: 699, pages: 210, description: "A 12-week quant plan with 1,500 graded problems, shortcut sheets and error logs used by 99 percentilers." },
    { title: "WAT & SOP Mastery", category: "GDPI", price: 399, pages: 60, description: "Written ability test structures and SOP narratives that admissions committees actually remember." },
  ];

  const playbookRows: { id: number; price: number; title: string }[] = [];
  for (const [idx, p] of playbookDefs.entries()) {
    const base64 = Buffer.from(`Demo playbook file for ${p.title}.`).toString("base64");
    const asset = await saveBase64Asset(adminId, `data:text/plain;base64,${base64}`, {
      mimeTypes: ["text/plain"],
      fileName: `${p.title.toLowerCase().replace(/\s+/g, "-")}.txt`,
    });
    const res = await db.insert(playbooks).values({
      title: p.title,
      category: p.category,
      price: p.price,
      pages: p.pages,
      description: p.description,
      coverImage: BOOK_COVERS[idx % BOOK_COVERS.length],
      fileUrl: assetRef(asset.id),
      isPublished: true,
    }).$returningId();
    playbookRows.push({ id: res[0].id, price: p.price, title: p.title });
  }
  console.log("playbooks done");

  // ---------------------------------------------------------------- events
  const evs = [
    {
      title: "Startup Hack — Build your B-plan", type: "hackathon" as const, emoji: "🚀",
      prize: "₹1,00,000 + fast-track interviews", status: "live" as const,
      startAt: new Date(now - 2 * day), endAt: new Date(now + 12 * day), coverImage: EVENT_COVERS[0],
      description: "Pick any Indian consumer app and tear it down: growth loops, monetisation leaks, and a 90-day roadmap. Submit a PPT or PDF deck (max 12 slides).",
      rules: "1. Teams of 1-3.\n2. Deck only — PDF/PPT/PPTX up to 8 MB.\n3. Plagiarism = instant disqualification.\n4. Top 5 teams present live to our jury.",
    },
    {
      title: "National Case Sprint: D2C Edition", type: "case_competition" as const, emoji: "🏆",
      prize: "₹50,000 + mentorship package", status: "live" as const,
      startAt: new Date(now - 1 * day), endAt: new Date(now + 20 * day), coverImage: EVENT_COVERS[1],
      description: "A D2C skincare brand is bleeding cash despite 3x revenue growth. Diagnose, model unit economics, and recommend a path to profitability.",
      rules: "1. Solo or duo participation.\n2. Submit a PDF report (max 10 pages) or PPT.\n3. Cite assumptions clearly.\n4. Judged on structure, math and practicality.",
    },
    {
      title: "FinTech Hack: Bharat Payments", type: "hackathon" as const, emoji: "💳",
      prize: "₹75,000 + incubation support", status: "closed" as const,
      startAt: new Date(now - 30 * day), endAt: new Date(now - 5 * day), coverImage: EVENT_COVERS[2],
      description: "Design payment flows for tier-3 India: UPI credit, offline-first wallets, and agent-led banking.",
      rules: "1. Teams of 2-4.\n2. Working prototype + 5-slide deck.\n3. Open-source stacks preferred.",
    },
    {
      title: "Agri Case Challenge 2025", type: "case_competition" as const, emoji: "🌾",
      prize: "₹40,000", status: "draft" as const,
      startAt: new Date(now + 25 * day), endAt: new Date(now + 45 * day), coverImage: EVENT_COVERS[3],
      description: "Cold-chain losses cost Indian farmers ₹90,000 crore a year. Build the business case for a viable fix.",
      rules: "1. Solo or duo.\n2. PDF report, max 12 pages.",
    },
  ];
  const eventIds: number[] = [];
  for (const e of evs) {
    const res = await db.insert(events).values({ ...e, createdBy: adminId }).$returningId();
    eventIds.push(res[0].id);
  }
  console.log("events done");

  // -------------------------------------------- mentorships + orders + sessions + reviews
  const pairs: { s: number; m: number; status: "active" | "completed" | "cancelled"; payment: "paid" | "pending" }[] = [];
  for (let i = 0; i < 40; i++) {
    pairs.push({
      s: (i * 7 + 3) % 25,
      m: (i * 11 + 5) % 25,
      status: i % 10 === 9 ? "cancelled" : i % 10 === 7 || i % 10 === 8 ? "completed" : "active",
      payment: i % 10 === 8 ? "pending" : "paid",
    });
  }
  // Deliberate duplicates: the same student books the same mentor twice (and thrice).
  pairs.push({ s: 0, m: 0, status: "completed", payment: "paid" });
  pairs.push({ s: 0, m: 0, status: "active", payment: "paid" });
  pairs.push({ s: 1, m: 2, status: "completed", payment: "paid" });
  pairs.push({ s: 1, m: 2, status: "active", payment: "paid" });

  let mentorshipCount = 0;
  let reviewCount = 0;
  for (const [i, p] of pairs.entries()) {
    const mentor = mentorSeeds[p.m];
    const studentEmail = studentEmails[p.s];
    const createdAt = new Date(now - (10 + (i % 50)) * day);

    let gdUsed = 0;
    let piUsed = 0;
    if (p.status === "completed") {
      gdUsed = mentor.gdTotal;
      piUsed = mentor.piTotal;
    } else if (p.status === "active") {
      gdUsed = rndInt(0, Math.max(0, mentor.gdTotal - 1));
      piUsed = rndInt(0, Math.max(0, mentor.piTotal - 1));
    }

    const res = await db.insert(mentorships).values({
      candidateId: userIds[studentEmail],
      mentorProfileId: mentor.profileId,
      plan: i % 3 === 0 ? "Intensive" : "Standard",
      price: mentor.price,
      status: p.status,
      gdTotal: mentor.gdTotal,
      gdUsed,
      piTotal: mentor.piTotal,
      piUsed,
      createdAt,
    }).$returningId();
    const mentorshipId = res[0].id;
    mentorshipCount++;

    // Mock sessions
    const sessionsToCreate: {
      type: "gd" | "pi"; status: "requested" | "scheduled" | "completed";
    }[] = [];
    for (let g = 0; g < gdUsed; g++) sessionsToCreate.push({ type: "gd", status: "completed" });
    for (let q = 0; q < piUsed; q++) sessionsToCreate.push({ type: "pi", status: "completed" });
    if (p.status === "active" && rnd() < 0.6) {
      sessionsToCreate.push({ type: rnd() < 0.5 ? "gd" : "pi", status: pick(["requested", "scheduled"] as const) });
    }
    if (p.status === "cancelled") {
      sessionsToCreate.push({ type: "gd", status: "requested" });
    }
    for (const [si, sess] of sessionsToCreate.entries()) {
      const completed = sess.status === "completed";
      await db.insert(mockSessions).values({
        mentorshipId,
        type: sess.type,
        topic: pick(SESSION_TOPICS),
        status: sess.status,
        scheduledNote: sess.status === "requested" ? null : "Sun 11 AM · Google Meet (link on WhatsApp)",
        score: completed ? rndInt(6, 10) : null,
        feedback: completed ? pick(SESSION_FEEDBACK) : null,
        createdAt: new Date(createdAt.getTime() + si * 3 * day),
      });
    }

    // Order
    await db.insert(orders).values({
      mentorshipId,
      studentId: userIds[studentEmail],
      amount: mentor.price,
      status: p.payment,
      provider: p.payment === "paid" ? "mock" : null,
      snapshot: { label: `Mentorship with ${mentor.name}` },
      createdAt,
    });

    // Review for completed mentorships (most, not all)
    if (p.status === "completed" && i % 4 !== 0) {
      await db.insert(reviews).values({
        mentorshipId,
        studentId: userIds[studentEmail],
        expertUserId: mentor.userId,
        rating: rndInt(4, 5),
        title: pick(REVIEW_TITLES),
        content: pick(REVIEW_BODIES),
        isPublic: true,
        status: "approved",
        createdAt: new Date(createdAt.getTime() + 20 * day),
      });
      reviewCount++;
    }
  }
  console.log(`mentorships done (${mentorshipCount} mentorships, ${reviewCount} reviews)`);

  // -------------------------------------------- playbook purchases + orders
  let purchaseCount = 0;
  for (let i = 0; i < 18; i++) {
    const sIdx = (i * 3 + 2) % 25;
    const pb = playbookRows[(i * 5 + 1) % playbookRows.length];
    try {
      const res = await db.insert(playbookPurchases).values({
        userId: userIds[studentEmails[sIdx]],
        playbookId: pb.id,
        price: pb.price,
        createdAt: new Date(now - (i % 30) * day),
      }).$returningId();
      await db.insert(orders).values({
        playbookPurchaseId: res[0].id,
        studentId: userIds[studentEmails[sIdx]],
        amount: pb.price,
        status: "paid",
        provider: "mock",
        snapshot: { label: pb.title },
        createdAt: new Date(now - (i % 30) * day),
      });
      purchaseCount++;
    } catch {
      // unique (userId, playbookId) — skip accidental duplicates
    }
  }
  console.log(`playbook purchases done (${purchaseCount})`);

  // ---------------------------------------------------------------- submissions
  let subCount = 0;
  for (let eIdx = 0; eIdx < 2; eIdx++) {
    for (let i = 0; i < 8; i++) {
      const sIdx = (i * 2 + eIdx * 11) % 25;
      const status = i === 0 ? "winner" : i < 3 ? "shortlisted" : i === 7 ? "rejected" : "submitted";
      const fileBody = Buffer.from(`Demo submission deck for ${SUBMISSION_TITLES[(i + eIdx * 4) % SUBMISSION_TITLES.length]}.`).toString("base64");
      await db.insert(submissions).values({
        eventId: eventIds[eIdx],
        userId: userIds[studentEmails[sIdx]],
        teamName: `Team ${LAST[(sIdx + eIdx) % 25]}`,
        title: SUBMISSION_TITLES[(i + eIdx * 4) % SUBMISSION_TITLES.length],
        note: "We focused on unit economics and a phased go-to-market.",
        fileName: "submission-deck.pdf",
        fileMime: "application/pdf",
        fileData: fileBody,
        fileSize: Math.floor(fileBody.length * 0.75),
        status,
        score: status === "submitted" ? null : rndInt(55, 95),
        feedback: status === "submitted" ? null : "Strong structure. Sharpen the financial assumptions before the final round.",
        createdAt: new Date(now - (2 + i) * day),
      });
      subCount++;
    }
  }
  console.log(`submissions done (${subCount})`);

  // ------------------------------------------------------ guest lecture requests
  for (let i = 0; i < 20; i++) {
    const cIdx = (i * 3 + 1) % 25;
    const mIdx = (i * 7 + 2) % 25;
    const status = i < 8 ? "pending" : i < 15 ? "accepted" : "rejected";
    await db.insert(guestLectureRequests).values({
      campusId: userIds[campusEmails[cIdx]],
      mentorProfileId: mentorSeeds[mIdx].profileId,
      status,
      topic: GUEST_TOPICS[i % GUEST_TOPICS.length],
      proposedDate: new Date(now + (3 + (i % 20)) * day),
      confirmedDate: status === "accepted" ? new Date(now + (3 + (i % 20)) * day) : null,
      campusNote: "We would love a 60-minute interactive session followed by Q&A with our final-year students.",
      campusContact: `${campusEmails[cIdx]} · ${phoneFor(cIdx, "96")}`,
      mentorNote: status === "rejected" ? "Clashing with a client offsite that week — happy to reschedule next month." : null,
      mentorContact: status === "accepted" ? mentorEmails[mIdx] : null,
      createdAt: new Date(now - (i % 15) * day),
    });
  }
  console.log("guest lecture requests done");

  // --------------------------------------------------------------- colleges
  await seedColleges(db);

  console.log("\nSeed complete.");
  console.log("Password for every account: Arenafograds@123");
  console.log("  Super Admin : superadmin@embark.in");
  console.log("  Admin       : admin@embark.in");
  console.log("  Student 1   : student@embark.in  (25 students total, *@seed.dev)");
  console.log("  Mentor 1    : mentor@embark.in   (25 mentors total, *.m*@seed.dev)");
  console.log("  Campus 1    : campus@embark.in   (25 campus accounts, campusN@seed.dev)");
  process.exit(0);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function seedColleges(db: any) {
  const data = [
    ["Indian Institute of Management Ahmedabad", "IIM A", "Ahmedabad", "Gujarat", "IIM", 1, 2500000, 34.4, 115.0, "CAT, GMAT", "99+ %ile CAT", 1961],
    ["Indian Institute of Management Bangalore", "IIM B", "Bengaluru", "Karnataka", "IIM", 2, 2450000, 35.3, 100.0, "CAT, GMAT", "99+ %ile CAT", 1973],
    ["Indian Institute of Management Kozhikode", "IIM K", "Kozhikode", "Kerala", "IIM", 3, 2250000, 31.0, 67.0, "CAT, GMAT", "97+ %ile CAT", 1996],
    ["Department of Management Studies, IIT Delhi", "DMS IIT Delhi", "New Delhi", "Delhi", "IIT", 4, 1200000, 28.6, 50.5, "CAT", "98+ %ile CAT", 1997],
    ["Indian Institute of Management Calcutta", "IIM C", "Kolkata", "West Bengal", "IIM", 5, 2700000, 35.1, 120.0, "CAT, GMAT", "99+ %ile CAT", 1961],
    ["Indian Institute of Management Mumbai", "IIM Mumbai", "Mumbai", "Maharashtra", "IIM", 6, 2100000, 27.8, 54.0, "CAT", "97+ %ile CAT", 1963],
    ["Indian Institute of Management Lucknow", "IIM L", "Lucknow", "Uttar Pradesh", "IIM", 7, 2080000, 30.0, 65.0, "CAT", "97+ %ile CAT", 1984],
    ["Indian Institute of Management Indore", "IIM I", "Indore", "Madhya Pradesh", "IIM", 8, 2110000, 25.7, 100.0, "CAT", "95+ %ile CAT", 1996],
    ["XLRI Xavier School of Management", "XLRI", "Jamshedpur", "Jharkhand", "Private", 9, 2720000, 29.9, 75.0, "XAT, GMAT", "95+ %ile XAT", 1949],
    ["Indian Institute of Technology Bombay (SJMSOM)", "SJMSOM IIT-B", "Mumbai", "Maharashtra", "IIT", 10, 1480000, 28.9, 54.0, "CAT", "98+ %ile CAT", 1995],
    ["Management Development Institute", "MDI Gurgaon", "Gurugram", "Haryana", "Private", 11, 2416000, 27.7, 60.0, "CAT, GMAT", "95+ %ile CAT", 1973],
    ["Indian Institute of Management Rohtak", "IIM Rohtak", "Rohtak", "Haryana", "IIM", 12, 1790000, 19.3, 36.0, "CAT", "95+ %ile CAT", 2009],
    ["SP Jain Institute of Management & Research", "SPJIMR", "Mumbai", "Maharashtra", "Private", 20, 2250000, 33.0, 81.0, "CAT, GMAT", "92+ %ile CAT", 1981],
    ["Indian Institute of Management Raipur", "IIM Raipur", "Raipur", "Chhattisgarh", "IIM", 14, 1610000, 21.0, 43.4, "CAT", "93+ %ile CAT", 2010],
    ["Indian Institute of Management Ranchi", "IIM Ranchi", "Ranchi", "Jharkhand", "IIM", 17, 1750000, 18.7, 37.8, "CAT", "93+ %ile CAT", 2010],
    ["Faculty of Management Studies, Delhi", "FMS Delhi", "New Delhi", "Delhi", "Govt", null, 232000, 34.1, 123.0, "CAT", "98+ %ile CAT", 1954],
    ["Indian Institute of Management Tiruchirappalli", "IIM Trichy", "Tiruchirappalli", "Tamil Nadu", "IIM", 22, 1680000, 19.5, 41.6, "CAT", "93+ %ile CAT", 2011],
    ["Indian Institute of Foreign Trade", "IIFT Delhi", "New Delhi", "Delhi", "Govt", 27, 2171000, 29.1, 85.4, "CAT, GMAT", "94+ %ile CAT", 1963],
    ["Symbiosis Institute of Business Management", "SIBM Pune", "Pune", "Maharashtra", "Private", 13, 2442000, 28.2, 35.0, "SNAP", "97+ %ile SNAP", 1978],
    ["Indian Institute of Management Udaipur", "IIM Udaipur", "Udaipur", "Rajasthan", "IIM", 16, 1900000, 20.3, 41.7, "CAT, GMAT", "92+ %ile CAT", 2011],
    ["Indian School of Business", "ISB Hyderabad", "Hyderabad", "Telangana", "Private", null, 4100000, 33.3, 66.0, "GMAT, GRE", "700+ GMAT", 2001],
    ["Indian Institute of Technology Madras (DoMS)", "DoMS IIT-M", "Chennai", "Tamil Nadu", "IIT", 15, 950000, 19.6, 29.6, "CAT", "96+ %ile CAT", 2004],
    ["Indian Institute of Management Shillong", "IIM Shillong", "Shillong", "Meghalaya", "IIM", 24, 1900000, 26.1, 71.5, "CAT", "92+ %ile CAT", 2007],
    ["SVKM's NMIMS, School of Business Management", "NMIMS Mumbai", "Mumbai", "Maharashtra", "Private", 21, 2440000, 26.6, 67.8, "NMAT", "232+ NMAT", 1981],
    ["Indian Institute of Technology Kharagpur (VGSOM)", "VGSOM IIT-KGP", "Kharagpur", "West Bengal", "IIT", 19, 1250000, 20.8, 43.4, "CAT", "95+ %ile CAT", 1993],
    ["Indian Institute of Management Kashipur", "IIM Kashipur", "Kashipur", "Uttarakhand", "IIM", 23, 1730000, 18.1, 37.0, "CAT", "92+ %ile CAT", 2011],
    ["Indian Institute of Management Nagpur", "IIM Nagpur", "Nagpur", "Maharashtra", "IIM", 25, 1890000, 16.7, 38.4, "CAT", "90+ %ile CAT", 2015],
    ["Indian Institute of Management Amritsar", "IIM Amritsar", "Amritsar", "Punjab", "IIM", 28, 1750000, 16.5, 36.0, "CAT", "88+ %ile CAT", 2015],
    ["Indian Institute of Management Visakhapatnam", "IIM Vizag", "Visakhapatnam", "Andhra Pradesh", "IIM", 26, 1730000, 16.6, 43.3, "CAT", "85+ %ile CAT", 2015],
    ["Indian Institute of Management Bodh Gaya", "IIM Bodh Gaya", "Bodh Gaya", "Bihar", "IIM", 33, 1600000, 15.5, 48.6, "CAT", "85+ %ile CAT", 2015],
    ["Indian Institute of Management Sambalpur", "IIM Sambalpur", "Sambalpur", "Odisha", "IIM", 50, 1350000, 14.2, 64.6, "CAT", "85+ %ile CAT", 2015],
    ["Indian Institute of Management Sirmaur", "IIM Sirmaur", "Sirmaur", "Himachal Pradesh", "IIM", 57, 1600000, 14.0, 64.1, "CAT", "85+ %ile CAT", 2015],
    ["Indian Institute of Management Jammu", "IIM Jammu", "Jammu", "J&K", "IIM", 42, 1710000, 15.5, 64.0, "CAT", "85+ %ile CAT", 2016],
    ["Xavier Institute of Management Bhubaneswar", "XIMB", "Bhubaneswar", "Odisha", "Private", 43, 1930000, 20.0, 26.0, "XAT, CAT, GMAT", "90+ %ile", 1987],
    ["Symbiosis Centre for Management & HRD", "SCMHRD", "Pune", "Maharashtra", "Private", null, 2350000, 23.7, 38.0, "SNAP", "94+ %ile SNAP", 1993],
    ["Institute of Management Technology", "IMT Ghaziabad", "Ghaziabad", "Uttar Pradesh", "Private", 38, 1953000, 17.7, 65.6, "CAT, XAT, GMAT", "90+ %ile", 1980],
    ["Tata Institute of Social Sciences (HRM & LR)", "TISS Mumbai", "Mumbai", "Maharashtra", "Govt", null, 185000, 27.2, 49.0, "CAT", "90+ %ile CAT", 1936],
    ["MICA Ahmedabad", "MICA", "Ahmedabad", "Gujarat", "Private", 32, 2300000, 20.1, 35.5, "CAT, XAT, GMAT + MICAT", "MICAT + 85 %ile", 1991],
    ["Indian Institute of Technology Roorkee (DoMS)", "DoMS IIT-R", "Roorkee", "Uttarakhand", "IIT", 18, 980000, 18.3, 24.0, "CAT", "95+ %ile CAT", 1998],
    ["Great Lakes Institute of Management", "Great Lakes", "Chennai", "Tamil Nadu", "Private", 34, 2195000, 15.1, 37.0, "CAT, XAT, GMAT, CMAT", "90+ %ile", 2004],
    ["Goa Institute of Management", "GIM Goa", "Goa", "Goa", "Private", 37, 1940000, 14.8, 29.0, "CAT, XAT, GMAT", "88+ %ile", 1993],
    ["T.A. Pai Management Institute", "TAPMI", "Manipal", "Karnataka", "Private", 58, 1730000, 14.6, 32.8, "CAT, XAT, GMAT", "85+ %ile", 1980],
    ["FORE School of Management", "FORE Delhi", "New Delhi", "Delhi", "Private", 53, 1827000, 14.5, 30.0, "CAT, XAT, GMAT", "86+ %ile CAT", 1981],
    ["Jamnalal Bajaj Institute of Management Studies", "JBIMS", "Mumbai", "Maharashtra", "Govt", null, 610000, 28.0, 35.8, "MAH-CET, CAT", "99+ %ile CET", 1965],
    ["International Management Institute Delhi", "IMI Delhi", "New Delhi", "Delhi", "Private", 40, 2095000, 16.7, 50.0, "CAT, XAT, GMAT", "88+ %ile CAT", 1981],
    ["Institute of Rural Management Anand", "IRMA", "Anand", "Gujarat", "Private", 55, 1611000, 15.5, 31.2, "CAT, XAT", "80+ %ile", 1979],
    ["Lal Bahadur Shastri Institute of Management", "LBSIM", "New Delhi", "Delhi", "Private", 68, 1590000, 12.4, 24.0, "CAT, XAT, GMAT", "85+ %ile", 1995],
    ["Birla Institute of Management Technology", "BIMTECH", "Greater Noida", "Uttar Pradesh", "Private", 64, 1400000, 11.1, 24.3, "CAT, XAT, GMAT, CMAT", "75+ %ile", 1988],
  ] as const;

  const logoDomains: Record<string, string> = {
    "IIM A": "iima.ac.in", "IIM B": "iimb.ac.in", "IIM K": "iimk.ac.in",
    "DMS IIT Delhi": "iitd.ac.in", "IIM C": "iimcal.ac.in", "IIM Mumbai": "iimmumbai.ac.in",
    "IIM L": "iiml.ac.in", "IIM I": "iimidr.ac.in", "XLRI": "xlri.ac.in",
    "SJMSOM IIT-B": "iitb.ac.in", "MDI Gurgaon": "mdi.ac.in", "IIM Rohtak": "iimrohtak.ac.in",
    "SPJIMR": "spjimr.org", "IIM Raipur": "iimraipur.ac.in", "IIM Ranchi": "iimranchi.ac.in",
    "FMS Delhi": "fms.edu", "IIM Trichy": "iimtrichy.ac.in", "IIFT Delhi": "iift.edu",
    "SIBM Pune": "sibm.edu", "IIM Udaipur": "iimu.ac.in", "ISB Hyderabad": "isb.edu",
    "DoMS IIT-M": "iitm.ac.in", "IIM Shillong": "iimshillong.ac.in", "NMIMS Mumbai": "nmims.edu",
    "VGSOM IIT-KGP": "iitkgp.ac.in", "IIM Kashipur": "iimkashipur.ac.in", "IIM Nagpur": "iimnagpur.ac.in",
    "IIM Amritsar": "iimamritsar.ac.in", "IIM Vizag": "iimv.ac.in", "IIM Bodh Gaya": "iimbg.ac.in",
    "IIM Sambalpur": "iimsambalpur.ac.in", "IIM Sirmaur": "iimsirmaur.ac.in", "IIM Jammu": "iimjammu.ac.in",
    "XIMB": "ximb.edu.in", "SCMHRD": "scmhrd.edu", "IMT Ghaziabad": "imt.edu",
    "TISS Mumbai": "tiss.edu", "MICA": "mica.ac.in", "DoMS IIT-R": "iitr.ac.in",
    "Great Lakes": "greatlakes.edu.in", "GIM Goa": "gim.ac.in", "TAPMI": "tapmi.edu.in",
    "FORE Delhi": "fsm.ac.in", "JBIMS": "jbims.edu", "IMI Delhi": "imi.edu",
    "IRMA": "irma.ac.in", "LBSIM": "lbsim.ac.in", "BIMTECH": "bimtech.ac.in",
  };

  for (const c of data) {
    const [name, shortName, city, state, type, nirfRank, fees, avgPackage, highestPackage, exams, cutoff, established] = c;
    const existing = await db.query.colleges.findFirst({
      where: (t: any, { eq }: any) => eq(t.name, name),
    });
    const website = `https://${logoDomains[shortName] ?? ""}`;
    const logoUrl = logoDomains[shortName]
      ? `https://logo.clearbit.com/${logoDomains[shortName]}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(shortName)}&background=f97316&color=fff&size=128`;
    if (!existing) {
      await db.insert(colleges).values({
        name, shortName, city, state, type,
        nirfRank: nirfRank ?? null,
        fees, avgPackage, highestPackage,
        exams, cutoff, established,
        website: logoDomains[shortName] ? website : null,
        logoUrl,
      });
    }
  }
  console.log("colleges done:", data.length);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
