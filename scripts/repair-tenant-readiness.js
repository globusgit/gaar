/* eslint-disable no-console */
require("dotenv/config");
const { MongoClient } = require("mongodb");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    const organizations = await db.collection("organizations").find({}).toArray();
    let ownersUpdated = 0;
    for (const organization of organizations) {
      if (!organization.phone) continue;
      const result = await db.collection("users").updateOne(
        {
          orgId: organization.orgId,
          username: organization.phone,
          role: "ORG_USER",
        },
        { $set: { role: "ADMIN", updatedAt: new Date() } },
      );
      ownersUpdated += result.modifiedCount;
    }
    console.log(`Updated ${ownersUpdated} legacy organization owner role(s)`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
