export function isHeadlessRuntime(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (navigator.webdriver) return true;
  return /HeadlessChrome|Playwright/i.test(navigator.userAgent);
}
