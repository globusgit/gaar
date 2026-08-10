import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/GAAR/);
    await expect(page.locator("input[name='username']")).toBeVisible();
    await expect(page.locator("input[name='password']")).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill("input[name='username']", "sysadmin");
    await page.fill("input[name='password']", "password123");
    await page.click("button[type='submit']");
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill("input[name='username']", "sysadmin");
    await page.fill("input[name='password']", "password123");
    await page.click("button[type='submit']");
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill("input[name='username']", "invalid");
    await page.fill("input[name='password']", "wrong");
    await page.click("button[type='submit']");
    
    await expect(page).toHaveURL(BASE_URL + "/");
    await expect(page.locator("text=/invalid|error|incorrect/i")).toBeVisible();
  });
});
