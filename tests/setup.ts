import { afterAll, beforeAll, beforeEach, expect } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

function needsDatabase(): boolean {
  const testPath = expect.getState().testPath || "";
  return /[\\/]tests[\\/](api|models)[\\/]/.test(testPath);
}

beforeAll(async () => {
  if (!needsDatabase()) return;
  mongod = await MongoMemoryServer.create({
    instance: { ip: "127.0.0.1" },
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  const { default: connectDB } = await import("@/lib/mongoose");
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once("open", resolve);
    });
  }
}, 120000);

afterAll(async () => {
  if (!needsDatabase()) return;
  try {
    await mongoose.connection.dropDatabase();
  } catch {
    // ignore
  }
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  if (mongod) {
    try {
      await mongod.stop();
    } catch {
      // ignore
    }
  }
}, 120000);

beforeEach(async () => {
  if (!needsDatabase()) return;
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const collections = await db.listCollections().toArray();
    for (const coll of collections) {
      try {
        await db.collection(coll.name).deleteMany({});
      } catch {
        // ignore errors for individual collections
      }
    }
  } catch {
    // connection might not be ready yet
  }
});

export const createTestOrg = async () => {
  const { default: Organization } = await import("@/models/Organization");
  const org = await Organization.create({
    orgName: "Test Org",
    orgId: "TESTORG",
    contactName: "Test",
    phone: "1234567890",
    email: "test@test.com",
    industryType: "IT",
    orgType: "PVT",
  });
  return org;
};

export const createTestUser = async (orgId: string, role = "ADMIN") => {
  const { default: User } = await import("@/models/User");
  const user = await User.create({
    username: `testuser_${Date.now()}`,
    password: "hashedpassword",
    employeeName: "Test User",
    status: "Active",
    role,
    orgId,
  });
  return user;
};

export const createTestEmployee = async (orgId: string) => {
  const { default: Employee } = await import("@/models/Employee");
  const emp = await Employee.create({
    name: "Test Employee",
    empId: `EMP${Date.now()}`,
    phone: "9876543210",
    email: "emp@test.com",
    designation: "Manager",
    orgId,
  });
  return emp;
};

export const createTestClient = async (orgId: string) => {
  const { default: Client } = await import("@/models/Client");
  const client = await Client.create({
    client: "Test Client",
    clientId: `CLI${Date.now()}`,
    phone: "9999999999",
    emailId: "client@test.com",
    state: "Telangana",
    orgId,
  });
  return client;
};

export const createTestSystemList = async (orgId: string, listName: string, listItem: string) => {
  const { default: SystemList } = await import("@/models/SystemList");
  const item = await SystemList.create({
    listName,
    listItem,
    orgId,
  });
  return item;
};

export const createTestConfig = async (orgId: string, name: string, value: string) => {
  const { default: Config } = await import("@/models/Config");
  const config = await Config.create({
    name,
    value,
    orgId,
  });
  return config;
};

export const getAuthHeaders = (user: { username: string; role: string; orgId: string }) => {
  const token = Buffer.from(
    JSON.stringify({
      id: user.username,
      username: user.username,
      role: user.role,
      orgId: user.orgId,
      employeeName: user.username,
    })
  ).toString("base64");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};
