import { test, expect } from '@playwright/test';

test.describe('Ticket 01: Gående skelett', () => {
  test('startsidan visas på svenska och länkarna till alla platshållarvyer navigerar tur och retur', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Yardage/i);

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('Yardage');

    const editLink = page.getByRole('link', { name: 'Redigeringsläge' });
    const playLink = page.getByRole('link', { name: 'Spelläge' });
    const settingsLink = page.getByRole('link', { name: 'Inställningar' });

    await expect(editLink).toBeVisible();
    await expect(playLink).toBeVisible();
    await expect(settingsLink).toBeVisible();

    // Navigera till Redigeringsläge (/edit) och tillbaka via appens länk
    await editLink.click();
    await expect(page).toHaveURL(/\/edit$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Redigeringsläge' })).toBeVisible();
    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await expect(page).toHaveURL(/\/$/);

    // Navigera till Spelläge (/play) och tillbaka via appens länk
    await page.getByRole('link', { name: 'Spelläge' }).click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Spelläge' })).toBeVisible();
    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await expect(page).toHaveURL(/\/$/);

    // Navigera till Inställningar (/settings) och tillbaka via appens länk
    await page.getByRole('link', { name: 'Inställningar' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Inställningar' })).toBeVisible();
    await page.getByRole('link', { name: 'Tillbaka till start' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('PWA-manifestet serveras och har appnamnet Yardage', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBe('Yardage');
    expect(manifest.short_name).toBe('Yardage');
  });
});
