import { getDb } from '../api/queries/connection.js';
import { users, mentorProfiles, expertOnboarding } from '../db/schema.js';
import { eq } from 'drizzle-orm';
async function main() {
  const db = getDb();
  const user = await db.select().from(users).where(eq(users.email, 'expert@embark.in')).limit(1);
  console.log('user:', JSON.stringify(user[0], null, 2));
  const profile = await db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, user[0]?.id)).limit(1);
  console.log('profile:', JSON.stringify(profile[0], null, 2));
  const onboarding = await db.select().from(expertOnboarding).where(eq(expertOnboarding.userId, user[0]?.id)).limit(1);
  console.log('onboarding:', JSON.stringify(onboarding[0], null, 2));
}
main();
