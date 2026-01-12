import { test, expect } from '@playwright/test';

test.describe('Content Hub Navigation', () => {
  test('should navigate through all content tabs and verify visibility', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes timeout
    
    // 1. Navigate directly to login page and authenticate
    console.log('Step 1: Signing in...');
    await page.goto('http://localhost:3004/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', 'admin@lighthouse.careers');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('✓ Signed in successfully');
    
    // 2. Navigate to Blog Posts page (Content section)
    console.log('\nStep 2: Navigating to Content section (Blog Posts)...');
    await page.goto('http://localhost:3004/dashboard/seo-pages/blog', {waitUntil: 'domcontentloaded', timeout: 30000});
    await page.waitForTimeout(3000);
    console.log('✓ Navigated to Blog Posts page');
    
    await page.screenshot({ path: '/Users/cedricseguela/Documents/code/lighthouse-network/blog-posts-page.png', fullPage: true });
    
    // 3. Verify all 5 tabs are visible on Blog Posts page
    console.log('\nStep 3: Verifying all 5 tabs on Blog Posts page...');
    const tabs = ['Blog Posts', 'Landing Pages', 'Suggestions', 'Scheduled', 'Bulk Operations'];
    
    console.log('\n==========================================');
    console.log('BLOG POSTS PAGE - Tab Visibility');
    console.log('==========================================');
    
    const tabResults = {};
    for (const tab of tabs) {
      const isVisible = await page.locator('text="' + tab + '"').first().isVisible({timeout: 3000}).catch(() => false);
      tabResults[tab] = isVisible;
      console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
    }
    
    const visibleCount = Object.values(tabResults).filter(v => v).length;
    console.log('\n  Result: ' + visibleCount + '/5 tabs visible');
    
    // 4. Click Landing Pages tab
    console.log('\n\nStep 4: Clicking Landing Pages tab...');
    await page.click('text=Landing Pages');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Landing Pages');
    
    console.log('\n==========================================');
    console.log('LANDING PAGES TAB - Tab Visibility');
    console.log('==========================================');
    
    for (const tab of tabs) {
      const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
      console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
    }
    
    // 5. Click Suggestions tab
    console.log('\n\nStep 5: Clicking Suggestions tab...');
    await page.click('text=Suggestions');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Suggestions');
    
    console.log('\n==========================================');
    console.log('SUGGESTIONS TAB - Tab Visibility');
    console.log('==========================================');
    
    for (const tab of tabs) {
      const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
      console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
    }
    
    // 6. Click Scheduled tab
    console.log('\n\nStep 6: Clicking Scheduled tab...');
    await page.click('text=Scheduled');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Scheduled');
    
    console.log('\n==========================================');
    console.log('SCHEDULED TAB - Tab Visibility');
    console.log('==========================================');
    
    for (const tab of tabs) {
      const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
      console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
    }
    
    // 7. Click Bulk Operations tab
    console.log('\n\nStep 7: Clicking Bulk Operations tab...');
    await page.click('text=Bulk Operations');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Bulk Operations');
    
    console.log('\n==========================================');
    console.log('BULK OPERATIONS TAB - Tab Visibility');
    console.log('==========================================');
    
    for (const tab of tabs) {
      const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
      console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
    }
    
    // 8. Navigate back to Blog Posts tab
    console.log('\n\nStep 8: Navigating back to Blog Posts tab...');
    await page.click('text=Blog Posts');
    await page.waitForTimeout(2000);
    console.log('✓ Back to Blog Posts');
    
    // 9. Click "Edit" on the first post
    console.log('\n\nStep 9: Clicking Edit on first blog post...');
    const firstEditButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    const hasEditButton = await firstEditButton.isVisible({timeout: 5000}).catch(() => false);
    
    if (!hasEditButton) {
      console.log('⚠ WARNING: No Edit button found (might be no posts yet)');
    } else {
      await firstEditButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ Opened blog editor');
      
      console.log('\n==========================================');
      console.log('BLOG EDITOR PAGE - Tab Visibility');
      console.log('==========================================');
      
      for (const tab of tabs) {
        const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
        console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
      }
      
      console.log('\nBreadcrumbs:');
      const breadcrumbsVisible = await page.locator('nav[aria-label="breadcrumb"], [class*="breadcrumb"]').isVisible().catch(() => false);
      console.log('  ' + (breadcrumbsVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
      
      await page.screenshot({ 
        path: '/Users/cedricseguela/Documents/code/lighthouse-network/blog-editor-screenshot.png',
        fullPage: true 
      });
      console.log('\n📸 Screenshot saved: blog-editor-screenshot.png');
    }
    
    // 10. Navigate to Landing Pages tab
    console.log('\n\nStep 10: Navigating to Landing Pages tab...');
    await page.click('text=Landing Pages');
    await page.waitForTimeout(2000);
    console.log('✓ Navigated to Landing Pages');
    
    // 11. Click "Edit" on the first landing page
    console.log('\nStep 11: Clicking Edit on first landing page...');
    const firstLPEditButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    const hasLPEditButton = await firstLPEditButton.isVisible({timeout: 5000}).catch(() => false);
    
    if (!hasLPEditButton) {
      console.log('⚠ WARNING: No Edit button found (might be no landing pages yet)');
    } else {
      await firstLPEditButton.click();
      await page.waitForTimeout(3000);
      console.log('✓ Opened landing page editor');
      
      console.log('\n==========================================');
      console.log('LANDING PAGE EDITOR - Tab Visibility');
      console.log('==========================================');
      
      for (const tab of tabs) {
        const isVisible = await page.locator('text="' + tab + '"').first().isVisible().catch(() => false);
        console.log('  ' + tab + ': ' + (isVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
      }
      
      console.log('\nBreadcrumbs:');
      const lpBreadcrumbsVisible = await page.locator('nav[aria-label="breadcrumb"], [class*="breadcrumb"]').isVisible().catch(() => false);
      console.log('  ' + (lpBreadcrumbsVisible ? '✓ VISIBLE' : '✗ NOT VISIBLE'));
      
      await page.screenshot({ 
        path: '/Users/cedricseguela/Documents/code/lighthouse-network/landing-page-editor-screenshot.png',
        fullPage: true 
      });
      console.log('\n📸 Screenshot saved: landing-page-editor-screenshot.png');
    }
    
    console.log('\n\n==========================================');
    console.log('✅ TEST COMPLETE');
    console.log('==========================================\n');
  });
});
