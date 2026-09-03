import { scryptSync, randomBytes } from "node:crypto";
import { getDb } from "../api/queries/connection";
import {
  users,
  mentorProfiles,
  playbooks,
  events,
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

const MENTOR_PHOTOS = {
  rohan: "/ai-images/mentor-rohan.jpg",
  ananya:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces",
};

const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop",
];

const EVENT_COVERS = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
];

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
  console.log("Resetting Arena for grads demo data...");
  await resetData(db);
  console.log("tables reset");

  // ---------------------------------------------------------------- users
  const seedUsers = [
    { name: "Super Admin", email: "superadmin@embark.in", role: "superadmin" as const },
    { name: "Admin", email: "admin@embark.in", role: "admin" as const },
    { name: "Aarya Sharma", email: "aarya@embark.in", role: "candidate" as const },
    { name: "Kabir Verma", email: "kabir.candidate@embark.in", role: "candidate" as const },
    { name: "Campus Coordinator", email: "campus@embark.in", role: "campus" as const },
    { name: "Rohan Mehta", email: "rohan@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/rohanmehta" },
    { name: "Ananya Iyer", email: "ananya@embark.in", role: "mentor" as const, linkedinUrl: "https://linkedin.com/in/ananyaiyer" },
  ];

  const userIds: Record<string, number> = {};
  for (const u of seedUsers) {
    const unionId = `email:${u.email}`;
    await db.insert(users).values({
      unionId,
      name: u.name,
      email: u.email,
      passwordHash: PASS,
      role: u.role,
      phone: "+91 98200 12345",
      linkedinUrl: (u as { linkedinUrl?: string }).linkedinUrl,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    });
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
      displayName: "Rohan Mehta",
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
      photo: MENTOR_PHOTOS.rohan,
    },
    {
      email: "ananya@embark.in",
      displayName: "Ananya Iyer",
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
      photo: MENTOR_PHOTOS.ananya,
    },
  ];

  for (const m of mentors) {
    const uid = userIds[m.email];
    const handle = m.email.replace("@embark.in", "").replace(".", "-");
    await db.insert(mentorProfiles).values({
      userId: uid,
      publicSlug: handle,
      displayName: m.displayName,
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
      profileImage: m.photo,
      coverImage: "",
      isVerified: true,
      verificationStatus: "verified",
      status: "active",
      onboardingStatus: "completed",
      profileCompletionPercent: 100,
    });
  }
  console.log("mentors done");

  // ---------------------------------------------------------------- playbooks
  const adminId = userIds["admin@embark.in"];
  const playbookFiles = [
    { title: "Crack the GD", body: "This is a placeholder playbook file for Crack the GD." },
    { title: "Master the PI", body: "This is a placeholder playbook file for Master the PI." },
  ];

  const fileAssetIds: number[] = [];
  for (const pf of playbookFiles) {
    const base64 = Buffer.from(pf.body).toString("base64");
    const dataUrl = `data:text/plain;base64,${base64}`;
    const asset = await saveBase64Asset(adminId, dataUrl, {
      mimeTypes: ["text/plain"],
      fileName: `${pf.title.toLowerCase().replace(/\s+/g, "-")}.txt`,
    });
    fileAssetIds.push(asset.id);
  }

  const pbs = [
    {
      title: "Crack the GD",
      category: "GDPI",
      price: 499,
      pages: 68,
      description: "Frameworks, opening lines, 40 practice topics, and the exact etiquette panelists look for in group discussions.",
      coverImage: BOOK_COVERS[0],
      fileUrl: assetRef(fileAssetIds[0]),
    },
    {
      title: "Master the PI",
      category: "GDPI",
      price: 599,
      pages: 112,
      description: "200 actual interview questions from IIM/XLRI/FMS panels with model answer structures and traps to avoid.",
      coverImage: BOOK_COVERS[1],
      fileUrl: assetRef(fileAssetIds[1]),
    },
  ];

  for (const p of pbs) {
    await db.insert(playbooks).values(p);
  }
  console.log("playbooks done");

  // ---------------------------------------------------------------- events
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const evs = [
    {
      title: "Startup Hack — Build your B-plan",
      type: "hackathon" as const,
      emoji: "",
      prize: "₹1,00,000 + fast-track interviews",
      status: "live" as const,
      startAt: new Date(now - 2 * day),
      endAt: new Date(now + 12 * day),
      coverImage: EVENT_COVERS[0],
      description:
        "Pick any Indian consumer app and tear it down: growth loops, monetisation leaks, and a 90-day roadmap. Submit a PPT or PDF deck (max 12 slides).",
      rules:
        "1. Teams of 1-3.\n2. Deck only — PDF/PPT/PPTX up to 8 MB.\n3. Plagiarism = instant disqualification.\n4. Top 5 teams present live to our jury.",
    },
    {
      title: "National Case Sprint: D2C Edition",
      type: "case_competition" as const,
      emoji: "",
      prize: "₹50,000 + mentorship package",
      status: "live" as const,
      startAt: new Date(now - 1 * day),
      endAt: new Date(now + 20 * day),
      coverImage: EVENT_COVERS[1],
      description:
        "A D2C skincare brand is bleeding cash despite 3x revenue growth. Diagnose, model unit economics, and recommend a path to profitability.",
      rules:
        "1. Solo or duo participation.\n2. Submit a PDF report (max 10 pages) or PPT.\n3. Cite assumptions clearly.\n4. Judged on structure, math and practicality.",
    },
  ];

  for (const e of evs) {
    await db.insert(events).values({ ...e, createdBy: adminId });
  }
  console.log("events done");

  // --------------------------------------------------------------- colleges
  await seedColleges(db);

  console.log("Seed complete.");
  console.log("Demo logins — password for all: Arenafograds@123");
  console.log("  Candidate: aarya@embark.in");
  console.log("  Candidate: kabir.candidate@embark.in");
  console.log("  Campus:    campus@embark.in");
  console.log("  Mentor:    rohan@embark.in");
  console.log("  Mentor:    ananya@embark.in");
  console.log("  Admin:     admin@embark.in");
  console.log("  Super:     superadmin@embark.in");
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
