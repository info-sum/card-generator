import { chromium } from 'playwright-core';

async function checkApp() {
    console.log('Starting Playwright validation...');
    const browser = await chromium.launch();
    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Check loading time
        const start = Date.now();
        await page.goto('http://localhost:5173/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - start;

        console.log(`Page load time: ${loadTime}ms`);
        if (loadTime > 2000) {
            console.warn('⚠️ Warning: Page load time EXCEEDS 2000ms.');
        } else {
            console.log('✅ Page renders under 2 seconds (Network Idle).');
        }

        // Check title
        const title = await page.title();
        console.log(`Title: ${title}`);

        // Check top-bar structure (Brand Logo and App Name)
        const logoExists = await page.locator('.top-brand-logo').isVisible();
        const appNameExists = await page.locator('.top-brand strong').isVisible();
        if (logoExists && appNameExists) {
            console.log('✅ [중앙] 브랜드 로고와 미니앱 이름이 표시됨.');
        } else {
            console.warn('⚠️ Warning: 브랜드 로고 또는 미니앱 이름을 찾을 수 없음.');
        }

        // Checking if there is a custom back button rendered in the HTML
        // Looking for an explicit return '<' or back button not required by the framework
        const customBackButton = await page.locator('header button:has-text("<")').count();
        if (customBackButton === 0) {
            console.log('✅ 자체 구현한 뒤로가기 버튼이 노출되지 않음.');
        } else {
            console.warn('⚠️ Warning: 자체 구현한 뒤로가기 버튼이 감지됨.');
        }

        // Check viewport
        const viewportTag = await page.locator('meta[name="viewport"]').getAttribute('content');
        if (viewportTag?.includes('user-scalable=no')) {
            console.log('✅ 제스처 기반 확대/축소가 비활성화됨.');
        } else {
            console.warn('⚠️ Warning: 제스처 기반 확대/축소 비활성화(viewport)를 확인할 수 없음.');
        }

        // Check theme
        // Let's assume there's a body style or color check
        const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
        console.log(`Body Background Color evaluates to: ${bodyBg}`);

        console.log('✨ All automated playwright checks complete.');
    } catch (err) {
        console.error('Playwright execution error:', err);
    } finally {
        await browser.close();
    }
}

checkApp();
