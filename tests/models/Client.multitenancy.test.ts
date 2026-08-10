import { describe, it, expect, beforeEach } from "vitest";
import Client from "@/models/Client";

describe("Client Model - Multi-tenancy", () => {
  beforeEach(async () => {
    await Client.deleteMany({});
  });

  it("should create clients in different orgs independently", async () => {
    const client1 = await Client.create({
      client: "Org1 Client",
      clientId: "CLI001",
      phone: "9876543210",
      emailId: "client1@test.com",
      state: "Telangana",
      orgId: "ORG1",
    });

    const client2 = await Client.create({
      client: "Org2 Client",
      clientId: "CLI002",
      phone: "9876543211",
      emailId: "client2@test.com",
      state: "Karnataka",
      orgId: "ORG2",
    });

    expect(client1.orgId).toBe("ORG1");
    expect(client2.orgId).toBe("ORG2");

    const org1Clients = await Client.find({ orgId: "ORG1" });
    const org2Clients = await Client.find({ orgId: "ORG2" });

    expect(org1Clients.length).toBe(1);
    expect(org2Clients.length).toBe(1);
  });

  it("should allow same clientId in different orgs", async () => {
    await Client.create({
      client: "Same ID Client",
      clientId: "CLI_SHARED",
      phone: "9876543210",
      emailId: "client1@test.com",
      state: "Telangana",
      orgId: "ORG1",
    });

    await Client.create({
      client: "Same ID Client 2",
      clientId: "CLI_SHARED",
      phone: "9876543211",
      emailId: "client2@test.com",
      state: "Karnataka",
      orgId: "ORG2",
    });

    const count = await Client.countDocuments({ clientId: "CLI_SHARED" });
    expect(count).toBe(2);
  });
});
