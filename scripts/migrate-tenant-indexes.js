require("dotenv/config");
const { MongoClient } = require("mongodb");

const obsoleteIndexes = [
  ["configs", "name_1"],
  ["tenderinfos", "tenderNo_1"],
  ["workorders", "woNo_1"],
];

const tenantUniqueIndexes = [
  ["clients", { orgId: 1, clientId: 1 }, "orgId_1_clientId_1"],
  ["employees", { orgId: 1, empId: 1 }, "orgId_1_empId_1"],
  ["fundrequests", { orgId: 1, frNo: 1 }, "orgId_1_frNo_1"],
  ["tenderinfos", { orgId: 1, tenderNo: 1 }, "orgId_1_tenderNo_1"],
  ["workorders", { orgId: 1, woNo: 1 }, "orgId_1_woNo_1"],
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const db = client.db();
    for (const [collectionName, indexName] of obsoleteIndexes) {
      const collection = db.collection(collectionName);
      if ((await collection.indexes()).some((index) => index.name === indexName)) {
        await collection.dropIndex(indexName);
        console.log(`Removed obsolete global index ${collectionName}.${indexName}`);
      }
    }
    for (const [collectionName, key, indexName] of tenantUniqueIndexes) {
      const collection = db.collection(collectionName);
      const existing = (await collection.indexes()).find((index) => index.name === indexName);
      if (existing?.unique === true) continue;
      if (existing) await collection.dropIndex(indexName);
      await collection.createIndex(key, { name: indexName, unique: true });
      console.log(`Created tenant-unique index ${collectionName}.${indexName}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
