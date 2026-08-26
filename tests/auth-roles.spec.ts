import { test, expect } from "@playwright/test";

test.describe("Embark auth & role flows", () => {
  test("candidate can sign in and reach dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input#email', "candidate@embark.in");
    await page.fill('input#password', "Embark@123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Your mentorships, playbooks and competition entries.')).toBeVisible();
  });

  test("mentor can sign in and reach mentor dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input#email', "rohan@embark.in");
    await page.fill('input#password', "Embark@123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/mentor\/dashboard/);
    await expect(page.locator('text=Mentor cockpit')).toBeVisible();
  });

  test("admin can sign in and reach admin dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input#email', "admin@embark.in");
    await page.fill('input#password', "Embark@123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Admin HQ')).toBeVisible();
  });

  test("superadmin can sign in and reach superadmin dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input#email', "superadmin@embark.in");
    await page.fill('input#password', "Embark@123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/superadmin/);
    await expect(page.locator('text=Superadmin control room')).toBeVisible();
  });

  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("candidate cannot access admin dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input#email', "candidate@embark.in");
    await page.fill('input#password', "Embark@123");
    await page.click('button[type="submit"]');
    await page.goto("http://localhost:3000/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
