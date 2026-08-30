import { scryptSync, randomBytes } from "node:crypto";
import { getDb } from "../api/queries/connection";
import {
  users,
  mentorProfiles,
  mentorServices,
  expertOnboarding,
  mentorships,
  mockSessions,
  playbooks,
  events,
  colleges,
  submissions,
} from "./schema";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const PASS = hashPassword("Arenafograds@123");

async function seed() {
  const db = getDb();
  console.log("Seeding Embark database...");

  // ---------------------------------------------------------------- users
  const seedUsers = [
    { name: "Super Admin", email: "superadmin@embark.in", role: "superadmin" as const },
    { name: "Admin", email: "admin@embark.in", role: "admin" as const },
    { name: "Aarya Sharma", email: "candidate@embark.in", role: "candidate" as const },
    { name: "Rohan Mehta", email: "rohan@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/rohanmehta" },
    { name: "Ananya Iyer", email: "ananya@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/ananyaiyer" },
    { name: "Vikram Malhotra", email: "vikram@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/vikrammalhotra" },
    { name: "Sneha Kulkarni", email: "sneha@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/snehakulkarni" },
    { name: "Arjun Nair", email: "arjun@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/arjunnair" },
    { name: "Priya Deshmukh", email: "priya@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/priyadeshmukh" },
    { name: "Kabir Singh Chauhan", email: "kabir@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/kabirchauhan" },
    { name: "Ishita Banerjee", email: "ishita@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/ishitabanerjee" },
    { name: "Expert User", email: "expert@embark.in", role: "expert" as const, linkedinUrl: "https://linkedin.com/in/expertuser" },
  ];

  const userIds: Record<string, number> = {};
  for (const u of seedUsers) {
    const unionId = `email:${u.email}`;
    await db
      .insert(users)
      .values({
        unionId,
        name: u.name,
        email: u.email,
        passwordHash: PASS,
        role: u.role,
        phone: "+91 98200 12345",
        linkedinUrl: (u as { linkedinUrl?: string }).linkedinUrl,
        termsAcceptedAt: new Date(),
        termsVersion: "1.0",
      })
      .onDuplicateKeyUpdate({ set: { name: u.name, role: u.role, termsAcceptedAt: new Date(), termsVersion: "1.0" } });
    const row = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.unionId, unionId),
    });
    userIds[u.email] = Number(row!.id);
  }
  console.log("users done");

  // ---------------------------------------------------------- mentor profiles
  const mentors = [
    {
      email: "rohan@embark.in",
      headline: "IIM Ahmedabad alum · ex-McKinsey · GD/PI specialist",
      bschool: "IIM Ahmedabad",
      company: "McKinsey & Company",
      expertise: "GD, PI, Consulting, Profile Building",
      yearsExp: 8,
      price: 14999,
      mockGds: 5,
      mockPis: 5,
      bio: "Converted IIMA, IIMB and IIMC. Spent 4 years at McKinsey before switching to full-time mentoring. 300+ mentees in top-20 B-schools.",
      whatsapp: "+91 98110 22334",
    },
    {
      email: "ananya@embark.in",
      headline: "XLRI Jamshedpur · HR & PI mentor · ex-HUL",
      bschool: "XLRI Jamshedpur",
      company: "Hindustan Unilever",
      expertise: "PI, HR Interview, SOP, WAT",
      yearsExp: 6,
      price: 9999,
      mockGds: 3,
      mockPis: 6,
      bio: "XLRI BM '18. Loves turning nervous candidates into storytellers. Specialises in HR interviews and SOP reviews.",
      whatsapp: "+91 99870 44556",
    },
    {
      email: "vikram@embark.in",
      headline: "IIM Calcutta · Goldman Sachs · Finance interviews",
      bschool: "IIM Calcutta",
      company: "Goldman Sachs",
      expertise: "PI, Finance, Case Prep, CFA",
      yearsExp: 9,
      price: 12999,
      mockGds: 4,
      mockPis: 4,
      bio: "Fin-grad turned IIMC alum. Preps candidates for finance-heavy interviews and case competitions.",
      whatsapp: "+91 98300 11223",
    },
    {
      email: "sneha@embark.in",
      headline: "FMS Delhi · Product @ Swiggy · Case comp coach",
      bschool: "FMS Delhi",
      company: "Swiggy",
      expertise: "Case Competitions, Product, GD",
      yearsExp: 5,
      price: 7999,
      mockGds: 4,
      mockPis: 3,
      bio: "National winner of 6 case comps including HUL LIME and TAS. Now coaches teams to do the same.",
      whatsapp: "+91 98118 33445",
    },
    {
      email: "arjun@embark.in",
      headline: "ISB Hyderabad · BCG · GMAT & profile strategy",
      bschool: "ISB Hyderabad",
      company: "Boston Consulting Group",
      expertise: "GMAT, ISB Essays, Consulting, PI",
      yearsExp: 7,
      price: 14999,
      mockGds: 2,
      mockPis: 6,
      bio: "ISB '19, GMAT 760. Helps working professionals crack ISB and global M7 programs.",
      whatsapp: "+91 99401 55667",
    },
    {
      email: "priya@embark.in",
      headline: "IIM Bangalore · Marketing & GD specialist · ex-Amazon",
      bschool: "IIM Bangalore",
      company: "Amazon",
      expertise: "GD, Marketing, WAT, Extempore",
      yearsExp: 6,
      price: 9999,
      mockGds: 6,
      mockPis: 3,
      bio: "Runs legendary mock GD batches. Known for brutal-but-kind feedback that sticks.",
      whatsapp: "+91 97420 66778",
    },
    {
      email: "kabir@embark.in",
      headline: "SPJIMR Mumbai · Ops & analytics interviews",
      bschool: "SPJIMR Mumbai",
      company: "Tata Consultancy Services",
      expertise: "PI, Operations, Analytics, WAT",
      yearsExp: 5,
      price: 6999,
      mockGds: 3,
      mockPis: 4,
      bio: "SPJIMR '20. Makes engineers sound like managers. Calm, structured, data-driven prep.",
      whatsapp: "+91 98923 77889",
    },
    {
      email: "ishita@embark.in",
      headline: "IIFT Delhi · International business · GK & WAT coach",
      bschool: "IIFT Delhi",
      company: "Aditya Birla Group",
      expertise: "WAT, GK, Trade, PI",
      yearsExp: 4,
      price: 5999,
      mockGds: 3,
      mockPis: 3,
      bio: "IIFT '21. Keeps you updated on trade, policy and everything the WAT topics come from.",
      whatsapp: "+91 98733 88990",
    },
  ];

  for (const m of mentors) {
    const uid = userIds[m.email];
    const existing = await db.query.mentorProfiles.findFirst({
      where: (t, { eq }) => eq(t.userId, uid),
    });
    if (existing) continue;
    const handle = m.email.replace("@embark.in", "");
    await db.insert(mentorProfiles).values({
      userId: uid,
      publicSlug: handle,
      headline: m.headline,
      bschool: m.bschool,
      company: m.company,
      expertise: m.expertise,
      yearsExp: m.yearsExp,
      price: m.price,
      mockGds: m.mockGds,
      mockPis: m.mockPis,
      bio: m.bio,
      whatsapp: m.whatsapp,
      linkedinUrl: `https://linkedin.com/in/${handle}`,
      isVerified: true,
    });
  }
  console.log("mentors done");

  // ------------------------------------------------------------- demo expert
  const expertUid = userIds["expert@embark.in"];
  if (expertUid) {
    await db
      .insert(mentorProfiles)
      .values({
        userId: expertUid,
        publicSlug: "expert-user",
        displayName: "Expert User",
        headline: "Product leader · ex-Flipkart · Strategy & Ops",
        bio: "15+ years in product and strategy across consumer internet and fintech.",
        company: "Independent",
        currentRole: "Product Leader",
        expertise: "Product Management, Strategy, Growth, Analytics",
        industries: "Consumer Internet, Fintech",
        location: "Bangalore",
        country: "India",
        timezone: "Asia/Kolkata",
        linkedinUrl: "https://linkedin.com/in/expertuser",
        profileImage: "",
        status: "active",
        onboardingStatus: "completed",
        verificationStatus: "verified",
        isVerified: true,
        profileCompletionPercent: 100,
      })
      .onDuplicateKeyUpdate({
        set: {
          publicSlug: "expert-user",
          displayName: "Expert User",
          headline: "Product leader · ex-Flipkart · Strategy & Ops",
          bio: "15+ years in product and strategy across consumer internet and fintech.",
          company: "Independent",
          currentRole: "Product Leader",
          expertise: "Product Management, Strategy, Growth, Analytics",
          industries: "Consumer Internet, Fintech",
          location: "Bangalore",
          country: "India",
          timezone: "Asia/Kolkata",
          linkedinUrl: "https://linkedin.com/in/expertuser",
          profileImage: "",
          status: "active",
          onboardingStatus: "completed",
          verificationStatus: "verified",
          isVerified: true,
          profileCompletionPercent: 100,
        },
      });

    await db
      .insert(expertOnboarding)
      .values({
        userId: expertUid,
        currentStep: "complete",
        status: "completed",
        completedAt: new Date(),
        lastCompletedStep: "complete",
      })
      .onDuplicateKeyUpdate({
        set: {
          currentStep: "complete",
          status: "completed",
          completedAt: new Date(),
          lastCompletedStep: "complete",
        },
      });

    const existingServices = await db.query.mentorServices.findFirst({
      where: (t, { eq }) => eq(t.userId, expertUid),
    });
    if (!existingServices) {
      await db.insert(mentorServices).values([
        {
          userId: expertUid,
          title: "1:1 Product Management Mentorship",
          slug: "product-management-mentorship",
          description:
            "Get personalized guidance on product strategy, interviews, and career planning. Ideal for aspiring PMs and early-career product managers.",
          serviceType: "one_on_one",
          price: 1499,
          currency: "INR",
          durationMinutes: 60,
          deliveryMode: "online",
          requirements: "Please share your resume and 2 target companies or roles.",
          outcomes: "Career assessment\nInterview guidance\nAction plan",
          status: "published",
          displayOrder: 0,
        },
        {
          userId: expertUid,
          title: "Resume & LinkedIn Review",
          slug: "resume-linkedin-review",
          description:
            "Detailed feedback on your resume and LinkedIn profile to position yourself for top B-schools and product roles.",
          serviceType: "review",
          price: 799,
          currency: "INR",
          durationMinutes: 45,
          deliveryMode: "async",
          requirements: "Upload your current resume and LinkedIn URL.",
          outcomes: "Edited resume\nLinkedIn optimization tips\nMessaging framework",
          status: "published",
          displayOrder: 1,
        },
      ]);
    }
  }

  // ------------------------------------------------------------- playbooks
  const pbs = [
    { title: "GD Mastery Playbook", category: "GDPI", price: 499, pages: 68, emoji: "🗣️", description: "Frameworks, opening lines, 40 practice topics, and the exact etiquette panelists look for in group discussions." },
    { title: "PI Crusher: 200 Real Questions", category: "GDPI", price: 599, pages: 112, emoji: "🎤", description: "200 actual interview questions from IIM/XLRI/FMS panels with model answer structures and traps to avoid." },
    { title: "WAT & Essay Toolkit", category: "WAT", price: 399, pages: 54, emoji: "✍️", description: "50 solved WAT topics, intro-body-conclusion templates, and a 15-minute daily writing routine." },
    { title: "Case Competition Bible", category: "Case Comps", price: 899, pages: 140, emoji: "🏆", description: "How national winners structure decks: guesstimates, MECE issue trees, storytelling and Q&A defence." },
    { title: "Consulting Casebook 2026", category: "Case Comps", price: 999, pages: 180, emoji: "💼", description: "35 full cases — market entry, profitability, pricing — with interviewer scripts and math drills." },
    { title: "Resume to Shortlist", category: "Profile", price: 299, pages: 36, emoji: "📄", description: "Bullet-by-bullet resume surgery, spike-building and the humblebrag formula for B-school forms." },
  ];
  for (const p of pbs) {
    const existing = await db.query.playbooks.findFirst({
      where: (t, { eq }) => eq(t.title, p.title),
    });
    if (!existing) await db.insert(playbooks).values(p);
  }
  console.log("playbooks done");

  // ---------------------------------------------------------------- events
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const evs = [
    {
      title: "HackCAT 2026 — Product Teardown Hackathon",
      type: "hackathon" as const,
      emoji: "💻",
      prize: "₹1,00,000 + fast-track interviews",
      status: "live" as const,
      startAt: new Date(now - 2 * day),
      endAt: new Date(now + 12 * day),
      description:
        "Pick any Indian consumer app and tear it down: growth loops, monetisation leaks, and a 90-day roadmap. Submit a PPT or PDF deck (max 12 slides).",
      rules:
        "1. Teams of 1-3.\n2. Deck only — PDF/PPT/PPTX up to 8 MB.\n3. Plagiarism = instant disqualification.\n4. Top 5 teams present live to our jury.",
    },
    {
      title: "National Case Sprint: D2C Edition",
      type: "case_competition" as const,
      emoji: "🧩",
      prize: "₹50,000 + mentorship package",
      status: "live" as const,
      startAt: new Date(now - 1 * day),
      endAt: new Date(now + 20 * day),
      description:
        "A D2C skincare brand is bleeding cash despite 3x revenue growth. Diagnose, model unit economics, and recommend a path to profitability.",
      rules:
        "1. Solo or duo participation.\n2. Submit a PDF report (max 10 pages) or PPT.\n3. Cite assumptions clearly.\n4. Judged on structure, math and practicality.",
    },
    {
      title: "Summer Strategy League 2025",
      type: "case_competition" as const,
      emoji: "☀️",
      prize: "₹25,000",
      status: "closed" as const,
      startAt: new Date(now - 90 * day),
      endAt: new Date(now - 30 * day),
      description:
        "Our pilot case competition — a market-entry strategy for an EV two-wheeler startup entering tier-2 India.",
      rules: "Closed event. Winners announced.",
    },
  ];
  const eventIds: number[] = [];
  for (const e of evs) {
    const existing = await db.query.events.findFirst({
      where: (t, { eq }) => eq(t.title, e.title),
    });
    if (existing) {
      eventIds.push(Number(existing.id));
    } else {
      const res = await db.insert(events).values({ ...e, createdBy: userIds["admin@embark.in"] });
      eventIds.push(Number(res[0].insertId));
    }
  }
  console.log("events done");

  // seed a winner for the closed event
  const closedEventId = eventIds[2];
  const existingSub = await db.query.submissions.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.eventId, closedEventId), eq(t.userId, userIds["candidate@embark.in"])),
  });
  if (!existingSub) {
    await db.insert(submissions).values({
      eventId: closedEventId,
      userId: userIds["candidate@embark.in"],
      teamName: "Orange Theory",
      title: "ChargePoint Bharat: Tier-2 EV Entry Strategy",
      note: "A phased cluster-based entry with battery-swap partnerships.",
      fileName: "orange-theory-ev.pdf",
      fileMime: "application/pdf",
      fileData: "",
      fileSize: 0,
      score: 92,
      feedback: "Crisp structure, realistic CAC math. Well deserved win.",
      status: "winner",
    });
  }

  // ----------------------------------------------------------- demo mentorship
  const rohanProfile = await db.query.mentorProfiles.findFirst({
    where: (t, { eq }) => eq(t.userId, userIds["rohan@embark.in"]),
  });
  if (rohanProfile) {
    const existingMs = await db.query.mentorships.findFirst({
      where: (t, { eq, and }) =>
        and(eq(t.candidateId, userIds["candidate@embark.in"]), eq(t.mentorProfileId, rohanProfile.id)),
    });
    if (!existingMs) {
      await db.insert(mentorships).values({
        candidateId: userIds["candidate@embark.in"],
        mentorProfileId: rohanProfile.id,
        plan: "Standard",
        price: rohanProfile.price,
        status: "active",
        gdTotal: rohanProfile.mockGds,
        gdUsed: 1,
        piTotal: rohanProfile.mockPis,
        piUsed: 1,
      });
      const msRow = await db.query.mentorships.findFirst({
        where: (t, { eq, and }) =>
          and(eq(t.candidateId, userIds["candidate@embark.in"]), eq(t.mentorProfileId, rohanProfile.id)),
      });
      if (msRow) {
        await db.insert(mockSessions).values([
          {
            mentorshipId: msRow.id,
            type: "gd",
            topic: "AI in Indian agriculture",
            status: "completed",
            score: 8,
            feedback: "Strong opening, keep conclusions tighter. Good structure overall.",
          },
          {
            mentorshipId: msRow.id,
            type: "pi",
            topic: "Tell me about yourself",
            status: "scheduled",
            scheduledNote: "Sat 10 AM · Google Meet",
          },
        ]);
      }
    }
  }

  // --------------------------------------------------------------- colleges
  await seedColleges(db);

  console.log("Seed complete.");
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
    "IIM A": "iima.ac.in",
    "IIM B": "iimb.ac.in",
    "IIM K": "iimk.ac.in",
    "DMS IIT Delhi": "iitd.ac.in",
    "IIM C": "iimcal.ac.in",
    "IIM Mumbai": "iimmumbai.ac.in",
    "IIM L": "iiml.ac.in",
    "IIM I": "iimidr.ac.in",
    "XLRI": "xlri.ac.in",
    "SJMSOM IIT-B": "iitb.ac.in",
    "MDI Gurgaon": "mdi.ac.in",
    "IIM Rohtak": "iimrohtak.ac.in",
    "SPJIMR": "spjimr.org",
    "IIM Raipur": "iimraipur.ac.in",
    "IIM Ranchi": "iimranchi.ac.in",
    "FMS Delhi": "fms.edu",
    "IIM Trichy": "iimtrichy.ac.in",
    "IIFT Delhi": "iift.edu",
    "SIBM Pune": "sibm.edu",
    "IIM Udaipur": "iimu.ac.in",
    "ISB Hyderabad": "isb.edu",
    "DoMS IIT-M": "iitm.ac.in",
    "IIM Shillong": "iimshillong.ac.in",
    "NMIMS Mumbai": "nmims.edu",
    "VGSOM IIT-KGP": "iitkgp.ac.in",
    "IIM Kashipur": "iimkashipur.ac.in",
    "IIM Nagpur": "iimnagpur.ac.in",
    "IIM Amritsar": "iimamritsar.ac.in",
    "IIM Vizag": "iimv.ac.in",
    "IIM Bodh Gaya": "iimbg.ac.in",
    "IIM Sambalpur": "iimsambalpur.ac.in",
    "IIM Sirmaur": "iimsirmaur.ac.in",
    "IIM Jammu": "iimjammu.ac.in",
    "XIMB": "ximb.edu.in",
    "SCMHRD": "scmhrd.edu",
    "IMT Ghaziabad": "imt.edu",
    "TISS Mumbai": "tiss.edu",
    "MICA": "mica.ac.in",
    "DoMS IIT-R": "iitr.ac.in",
    "Great Lakes": "greatlakes.edu.in",
    "GIM Goa": "gim.ac.in",
    "TAPMI": "tapmi.edu.in",
    "FORE Delhi": "fsm.ac.in",
    "JBIMS": "jbims.edu",
    "IMI Delhi": "imi.edu",
    "IRMA": "irma.ac.in",
    "LBSIM": "lbsim.ac.in",
    "BIMTECH": "bimtech.ac.in",
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
