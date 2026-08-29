import { getDb } from "./api/queries/connection";
import { users } from "./db/schema";

async function main() {
  const db = getDb();
  const rows = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .limit(10);
  console.log(rows);
}

main().then(() => process.exit(0));
