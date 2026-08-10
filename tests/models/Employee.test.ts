import { describe, it, expect, beforeEach } from "vitest";
import Employee from "@/models/Employee";

describe("Employee Model", () => {
  beforeEach(async () => {
    await Employee.deleteMany({});
  });

  it("should create an employee with required fields", async () => {
    const emp = await Employee.create({
      name: "Test Employee",
      empId: "EMP001",
      phone: "9876543210",
      email: "emp@test.com",
      designation: "Manager",
      orgId: "TESTORG",
    });

    expect(emp._id).toBeDefined();
    expect(emp.name).toBe("Test Employee");
    expect(emp.empId).toBe("EMP001");
    expect(emp.isManager).toBeUndefined();
  });

  it("should enforce required fields", async () => {
    await expect(
      Employee.create({
        // missing required fields
        orgId: "TESTORG",
         
      } as any)
    ).rejects.toThrow();
  });

  it("should allow same empId in different orgs", async () => {
    await Employee.create({
      name: "Emp One",
      empId: "EMP003",
      phone: "9876543210",
      email: "emp1@test.com",
      designation: "Manager",
      orgId: "ORG1",
    });

    await Employee.create({
      name: "Emp Two",
      empId: "EMP003",
      phone: "9876543211",
      email: "emp2@test.com",
      designation: "Manager",
      orgId: "ORG2",
    });

    const count = await Employee.countDocuments({ empId: "EMP003" });
    expect(count).toBe(2);
  });

  it("should have orgId + empId index", async () => {
    const indexes = await Employee.collection.indexes();
    const hasIndex = indexes.some(
      (idx: unknown) => {
        const key = (idx as { key?: Record<string, unknown> }).key;
        return key?.orgId === 1 && key?.empId === 1;
      }
    );
    expect(hasIndex).toBe(true);
  });
});
