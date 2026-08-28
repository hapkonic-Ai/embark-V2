function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(list: T[], key: string): T {
  return list[hashString(key) % list.length];
}

function genderFromName(name: string): "woman" | "man" {
  const n = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "");
  if (!n) return "man";

  const women = new Set([
    "aadhya", "aanya", "aaradhya", "aditi", "ahana", "aisha", "akanksha", "ananya",
    "anika", "anisha", "anjali", "anya", "aradhya", "avani", "avni", "chhavi",
    "deepa", "diya", "divya", "drishti", "eshita", "garima", "gayatri", "geeta",
    "ia", "isha", "ishita", "jahnavi", "jhanvi", "juhi", "kavya", "kiara", "kiran",
    "kirti", "kriti", "kritika", "larissa", "lavanya", "mahima", "manya", "maya",
    "meera", "megha", "mira", "myra", "naina", "navya", "neha", "nisha", "niyati",
    "pari", "pooja", "prerna", "priya", "priyanka", "rhea", "riya", "saira",
    "sakshi", "samaira", "sana", "sanaya", "sanya", "shivani", "shreya", "shruti",
    "simran", "sneha", "sohani", "sonali", "suhana", "swara", "tara", "tanisha",
    "tanvi", "tanya", "trisha", "tvisha", "umang", "vaishnavi", "vanya", "vasudha",
    "vedika", "vidya", "yashasvi", "zara",
  ]);

  const men = new Set([
    "aadi", "aakash", "aaditya", "aarav", "abhay", "abhinav", "abhishek", "adarsh",
    "aditya", "advait", "ajay", "akshat", "akshay", "amit", "aman", "aniket",
    "anirudh", "ankit", "anmol", "ansh", "arjun", "aryan", "atharv", "ayush",
    "bhavya", "chirag", "deepak", "dev", "devansh", "dhruv", "divyansh", "farhan",
    "harsh", "himanshu", "ishaan", "jai", "kabir", "karan", "kartik", "kaushal",
    "krish", "kunal", "lakshay", "lucky", "manav", "mayank", "mohit", "nakul",
    "naveen", "nikhil", "nilesh", "nitin", "om", "parth", "pranav", "pranjal",
    "rahul", "raj", "rajat", "rajesh", "ram", "ravi", "rehan", "reyansh",
    "rohan", "rohit", "rudra", "sachin", "sahil", "samar", "sarthak", "satvik",
    "shaurya", "shiv", "shubham", "siddharth", "soham", "tarun", "uday", "varun",
    "vatsal", "veer", "vijay", "vikas", "vinay", "vivek", "yash", "yuvraj",
  ]);

  if (women.has(n)) return "woman";
  if (men.has(n)) return "man";

  // Soft heuristic: endings common in Indian female names
  if (["a", "i", "ee", "ie", "ya", "vi", "na"].some((s) => n.endsWith(s))) return "woman";
  // Common male endings
  if (["n", "l", "r", "h", "sh", "th", "k", "v", "j", "m"].some((s) => n.endsWith(s))) return "man";

  return "man";
}

const MALE_FACES = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936cbed?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1521119989659-a83d05219729?w=400&h=400&fit=crop&crop=faces",
];

const FEMALE_FACES = [
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1554151228-14d9def656ec?w=400&h=400&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
];

const EVENT_COVERS = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1540575460203-b5a3f39e7485?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560439514-4e9645031354?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1475721027785-f74eccf7a27d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
];

const BOOK_COVERS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1555116505-a1d6d531f802?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=800&fit=crop",
];

const CAMPUS_IMAGES = [
  "https://images.unsplash.com/photo-1562774053-701fd40f5c73?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1592280635425-2d772f1f6c31?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1492538368676-f23c0143ac81?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1606761568499-6d2451b23cfa?w=800&h=500&fit=crop",
];

export function fallbackFace(name: string): string {
  return genderFromName(name) === "woman"
    ? pick(FEMALE_FACES, name)
    : pick(MALE_FACES, name);
}

export function speakerImage(name: string, _topic: string): string {
  return fallbackFace(name);
}

export function eventCoverImage(
  _type: "hackathon" | "case_competition",
  title: string,
): string {
  return pick(EVENT_COVERS, title);
}

export function playbookCoverImage(title: string): string {
  return pick(BOOK_COVERS, title);
}

export function collegeCampusImage(name: string): string {
  return pick(CAMPUS_IMAGES, name);
}

export function mentorImage(name: string, _bschool: string): string {
  return fallbackFace(name);
}

export function studentImage(name: string): string {
  return fallbackFace(name);
}

export function reviewPersonImage(name: string): string {
  return fallbackFace(name);
}
