import { describe, it, expect, beforeEach } from "vitest";
import PaymentInfo from "@/models/PaymentInfo";

describe("PaymentInfo Model", () => {
  beforeEach(async () => {
    await PaymentInfo.deleteMany({});
  });

  it("should create a payment with required fields", async () => {
    const payment = await PaymentInfo.create({
      paymentType: "RTGS",
      frType: "Normal",
      description: "Test payment",
      requestAmount: 1000,
      paidAmount: 0,
      balanceAmount: 1000,
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User",
      status: "Pending",
      requestedDate: new Date(),
      orgId: "TESTORG",
    });

    expect(payment._id).toBeDefined();
    expect(payment.paymentType).toBe("RTGS");
    expect(payment.requestAmount).toBe(1000);
    expect(payment.balanceAmount).toBe(1000);
    expect(payment.isApproved).toBe(false);
    expect(payment.isAuthorized).toBe(false);
  });

  it("should allow optional approvedBy", async () => {
    const payment = await PaymentInfo.create({
      paymentType: "RTGS",
      frType: "Normal",
      description: "Test payment",
      requestAmount: 1000,
      paidAmount: 0,
      balanceAmount: 1000,
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User",
      status: "Pending",
      requestedDate: new Date(),
      orgId: "TESTORG",
    });

    expect(payment.approvedBy).toBeUndefined();
  });

  it("should enforce required fields", async () => {
    await expect(
      PaymentInfo.create({
        // missing required fields
        orgId: "TESTORG",
         
      } as any)
    ).rejects.toThrow();
  });

  it("should default isApproved and isAuthorized to false", async () => {
    const payment = await PaymentInfo.create({
      paymentType: "RTGS",
      frType: "Normal",
      description: "Test payment",
      requestAmount: 1000,
      paidAmount: 0,
      balanceAmount: 1000,
      subVertical: "Software",
      paymentTo: "Vendor",
      requestedBy: "User",
      status: "Pending",
      requestedDate: new Date(),
      orgId: "TESTORG",
    });

    expect(payment.isApproved).toBe(false);
    expect(payment.isAuthorized).toBe(false);
  });
});
