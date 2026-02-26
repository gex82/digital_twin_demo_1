import { test, expect, type Page } from '@playwright/test';

const DEMO_EMAIL = 'demo@patterson.com';
const DEMO_PASSWORD = 'Patterson2024!';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await expect(page.getByText('Welcome back')).toBeVisible();
  await page.locator('input[type="email"]').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: /^Sign In/ }).click();
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.locator('[data-demo-anchor="demo-dashboard-kpi-grid"]')).toBeVisible();
}

function bubble(page: Page) {
  return page.getByTestId('demo-bubble');
}

async function expectStage(page: Page, stageNumber: number): Promise<void> {
  await expect(bubble(page).getByText(new RegExp(`^Stage ${stageNumber} of 11:`))).toBeVisible({
    timeout: 120_000,
  });
}

async function waitForBubbleReady(page: Page, expectNextEnabled = true): Promise<void> {
  await expect(bubble(page).getByText('Running actions')).toHaveCount(0, { timeout: 120_000 });
  await expect(bubble(page).getByText('Action needs retry')).toHaveCount(0);
  const nextButton = bubble(page).getByRole('button', { name: 'Next' });
  if (expectNextEnabled) {
    await expect(nextButton).toBeEnabled({ timeout: 120_000 });
    return;
  }
  await expect(nextButton).toBeDisabled();
}

test('authenticated route smoke across all primary pages', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  await login(page);

  const navChecks: Array<{ href: string; route: RegExp }> = [
    { href: '/app/network', route: /\/app\/network$/ },
    { href: '/app/scenarios', route: /\/app\/scenarios$/ },
    { href: '/app/ai', route: /\/app\/ai$/ },
    { href: '/app/cost-to-serve', route: /\/app\/cost-to-serve$/ },
    { href: '/app/service-level', route: /\/app\/service-level$/ },
    { href: '/app/reports', route: /\/app\/reports$/ },
    { href: '/app/decision-cockpit', route: /\/app\/decision-cockpit$/ },
    { href: '/app/dashboard', route: /\/app\/dashboard$/ },
  ];

  for (const step of navChecks) {
    await page.locator(`a[href="${step.href}"]`).first().click();
    await expect(page).toHaveURL(step.route);
  }

  expect(runtimeErrors).toEqual([]);
});

test('top bar command-center toggle and calibration pill render correctly', async ({ page }) => {
  await login(page);
  await expect(page.getByTestId('model-calibration-pill')).toContainText('Model Calibrated:');
  await expect(page.getByTestId('command-center-toggle')).toBeVisible();

  await expect
    .poll(async () => page.evaluate(() => document.body.classList.contains('command-center-mode')))
    .toBe(false);

  await page.getByTestId('command-center-toggle').click();
  await expect
    .poll(async () => page.evaluate(() => document.body.classList.contains('command-center-mode')))
    .toBe(true);

  await page.getByTestId('command-center-toggle').click();
  await expect
    .poll(async () => page.evaluate(() => document.body.classList.contains('command-center-mode')))
    .toBe(false);
});

test('AI assistant renders a single welcome message without duplicates', async ({ page }) => {
  await login(page);
  await page.locator('a[href="/app/ai"]').first().click();
  await expect(page).toHaveURL(/\/app\/ai$/);
  await expect(page.locator('[data-ai-message-id="welcome"]')).toHaveCount(1);

  const promptInput = page.getByPlaceholder('Ask SupplyIQ about your network...');
  await promptInput.fill('Give me a network overview');
  await promptInput.press('Enter');
  await expect(page.locator('[data-ai-message-id="welcome"]')).toHaveCount(1);
});

test('service-level facility sparklines are differentiated per FC', async ({ page }) => {
  await login(page);
  await page.locator('a[href="/app/service-level"]').first().click();
  await expect(page).toHaveURL(/\/app\/service-level$/);
  await page.getByRole('button', { name: 'By Facility' }).click();

  const points = await page.locator('svg polyline').evaluateAll((nodes) =>
    nodes.slice(0, 8).map((node) => node.getAttribute('points') ?? '')
  );
  const unique = new Set(points.filter((entry) => entry.length > 0));
  expect(unique.size).toBeGreaterThan(1);
});

test('sidebar utilities open actionable panels and scenario badge matches list count', async ({ page }) => {
  await login(page);

  await page.getByTestId('sidebar-utility-settings').click();
  const panel = page.getByTestId('sidebar-utility-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('Settings');
  await panel.getByRole('button', { name: /Command Center:/ }).click();
  await expect(panel.getByRole('button', { name: /Command Center:/ })).toBeVisible();

  const badgeText = await page.getByTestId('sidebar-scenarios-badge').innerText();
  const badgeCount = Number.parseInt(badgeText, 10);
  await page.locator('a[href="/app/scenarios"]').first().click();
  await expect(page).toHaveURL(/\/app\/scenarios$/);
  const scenarioCheckboxes = page.locator('input[type="checkbox"]');
  await expect(scenarioCheckboxes.first()).toBeVisible();
  const listCount = await scenarioCheckboxes.count();
  expect(Number.isNaN(badgeCount)).toBe(false);
  expect(badgeCount).toBe(listCount);
});

test('guided start demo flow advances through all 11 stages', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-demo-anchor="demo-landing-start"]').first().click();

  await expectStage(page, 1);
  await waitForBubbleReady(page);

  const stageRouteExpectations: Array<{ stage: number; route: RegExp }> = [
    { stage: 2, route: /\/login$/ },
    { stage: 3, route: /\/app\/dashboard$/ },
    { stage: 4, route: /\/app\/network$/ },
    { stage: 5, route: /\/app\/scenarios$/ },
    { stage: 6, route: /\/app\/scenarios$/ },
    { stage: 7, route: /\/app\/cost-to-serve$/ },
    { stage: 8, route: /\/app\/service-level$/ },
    { stage: 9, route: /\/app\/ai$/ },
    { stage: 10, route: /\/app\/reports$/ },
    { stage: 11, route: /\/app\/decision-cockpit$/ },
  ];

  for (const step of stageRouteExpectations) {
    await bubble(page).getByRole('button', { name: 'Next' }).click();
    await expectStage(page, step.stage);
    await expect(page).toHaveURL(step.route, { timeout: 120_000 });
    await waitForBubbleReady(page, step.stage < 11);
  }

  await expect(bubble(page).getByText('Demo complete')).toBeVisible({ timeout: 15_000 });
  await expect(bubble(page).getByRole('button', { name: 'Next' })).toBeDisabled();
});

test('guided demo Back moves to the prior stage and route', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-demo-anchor="demo-landing-start"]').first().click();
  await expectStage(page, 1);
  await waitForBubbleReady(page);

  await bubble(page).getByRole('button', { name: 'Next' }).click();
  await expectStage(page, 2);
  await expect(page).toHaveURL(/\/login$/);
  await waitForBubbleReady(page);

  await bubble(page).getByRole('button', { name: 'Next' }).click();
  await expectStage(page, 3);
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await waitForBubbleReady(page);

  await bubble(page).getByRole('button', { name: 'Next' }).click();
  await expectStage(page, 4);
  await expect(page).toHaveURL(/\/app\/network$/);
  await waitForBubbleReady(page);

  await bubble(page).getByRole('button', { name: 'Back' }).click();
  await expectStage(page, 3);
  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await waitForBubbleReady(page);
});

test('decision cockpit approval chain and board pack export', async ({ page }) => {
  await login(page);
  await page.locator('a[href="/app/decision-cockpit"]').first().click();
  await expect(page).toHaveURL(/\/app\/decision-cockpit$/);
  await expect(page.locator('[data-demo-anchor="demo-cockpit-summary"]')).toBeVisible();

  const approvalStages = ['analyst', 'director', 'vp'] as const;
  for (const stage of approvalStages) {
    const row = page.locator(`[data-demo-anchor="demo-cockpit-approval-${stage}"]`);
    await row.getByRole('button', { name: 'Approve' }).click();
    await expect(row).toContainText('Approved');
  }

  await page.getByRole('button', { name: /Generate Board Pack/ }).click();
  await expect(page.locator('[data-demo-anchor="demo-cockpit-export"]')).toContainText('board-pack');
});
