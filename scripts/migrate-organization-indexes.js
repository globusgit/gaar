require("dotenv/config");
const { MongoClient } = require("mongodb");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const organizations = client.db().collection("organizations");
    for (const field of ["phone", "email", "website"]) {
      const name = `${field}_1`;
      const existing = (await organizations.indexes()).find((index) => index.name === name);
      if (existing && existing.unique === true && existing.sparse === true) continue;
      if (existing) await organizations.dropIndex(name);
      await organizations.createIndex({ [field]: 1 }, { name, unique: true, sparse: true });
      console.log(`Updated ${name} to a sparse unique index`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
