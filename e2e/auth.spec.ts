import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for login elements
    await expect(page.locator('h1')).toContainText(/Sign in|Login|Welcome/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');
    
    // Click on signup link
    const signupLink = page.locator('text=/sign up|create account|register/i');
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page.url()).toContain('/signup');
    }
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/');
    
    // Click on forgot password link
    const forgotLink = page.locator('text=/forgot password|reset password/i');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      
      // Fill in email for password reset
      await page.fill('input[type="email"]', 'user@example.com');
      await page.click('button[type="submit"]');
      
      // Check for success message
      await expect(page.locator('text=/sent|check your email/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/');
    
    // Enter invalid email format
    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check for validation error
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should require password', async ({ page }) => {
    await page.goto('/');
    
    // Only fill email
    await page.fill('input[type="email"]', 'user@example.com');
    await page.click('button[type="submit"]');
    
    // Check that form doesn't submit
    const passwordInput = page.locator('input[type="password"]');
    const isRequired = await passwordInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBeTruthy();
  });
});