import { test, expect } from '@playwright/test';

test.describe('Match Funnel Accuracy Verification', () => {
  test.setTimeout(180000); // 3 minutes per test

  const testCases = [
    {
      name: 'Captain 3000GT 70m',
      query: 'Captain for 70m yacht, must have 3000GT license',
      expectations: {
        noChiefOfficers: true, // Chief Officers should NOT appear for Captain search
        requireLicense: '3000GT',
      },
    },
    {
      name: 'Chief Stewardess 55m',
      query: 'Chief Stewardess for 55m yacht with 5+ years experience',
      expectations: {
        noJuniorStews: true, // 2nd Stews should NOT appear
        minExperienceYears: 2, // Should have substantial experience
      },
    },
    {
      name: 'Nanny French/English 8yrs',
      query: 'Nanny fluent in French and English with 8 years childcare experience',
      expectations: {
        noYachtCrew: true, // Yacht deck/interior crew without childcare exp should NOT appear
        requireChildcareExperience: true,
      },
    },
    {
      name: 'Head Chef Michelin 5yrs',
      query: 'Head Chef with Michelin experience and 5 years yacht experience',
      expectations: {
        noSousChefs: true, // Sous Chefs should NOT appear
        requireChefRole: true,
      },
    },
    {
      name: 'Butler formal training',
      query: 'Butler with formal training and UHNW household experience',
      expectations: {
        requireButlerRole: true,
        acceptZeroResults: true, // It's OK to have 0 results if no qualified candidates
      },
    },
    {
      name: 'Deckhand 50m entry-level',
      query: 'Deckhand for 50m yacht, entry-level welcome',
      expectations: {
        allowJuniorRoles: true, // This is an entry-level position
        requireDeckRole: true,
      },
    },
  ];

  for (const testCase of testCases) {
    test(`Match accuracy: ${testCase.name}`, async ({ page }) => {
      // Navigate to match page
      await page.goto('/match', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Find the search input and enter query
      const searchInput = page.locator('textarea[placeholder*="describe"], input[placeholder*="describe"]');
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });
      await searchInput.fill(testCase.query);

      // Click search/match button
      const searchButton = page.locator('button:has-text("Find"), button:has-text("Match"), button:has-text("Search")');
      await searchButton.first().click();

      // Wait for results to load (look for loading indicator to disappear)
      await page.waitForTimeout(5000); // Initial wait

      // Wait for results or empty state
      try {
        await page.waitForSelector('[data-testid="match-results"], [data-testid="no-results"], .candidate-card, .no-candidates', {
          timeout: 60000,
        });
      } catch {
        // If no specific selector, just wait for network to settle
        await page.waitForLoadState('networkidle');
      }

      await page.waitForTimeout(3000); // Additional wait for AI processing

      // Get page content for analysis
      const pageContent = await page.content();
      const textContent = await page.locator('body').textContent();

      // Screenshot for debugging
      await page.screenshot({
        path: `/Users/cedricseguela/Documents/code/lighthouse-network/e2e-tests/screenshots/${testCase.name.replace(/\s+/g, '-')}.png`,
        fullPage: true,
      });

      // Check results
      console.log(`\n========== ${testCase.name} ==========`);
      console.log(`Query: ${testCase.query}`);

      // Check for "no results" or "0 candidates" message
      const noResultsPatterns = [
        /no candidates/i,
        /no matches/i,
        /couldn't find/i,
        /0 candidates/i,
        /no results/i,
      ];

      const hasNoResults = noResultsPatterns.some(pattern => pattern.test(textContent || ''));

      if (hasNoResults) {
        console.log('Result: 0 candidates found');
        if (testCase.expectations.acceptZeroResults) {
          console.log('✅ Zero results is acceptable for this query');
        }
      } else {
        // Extract candidate information from the page
        const candidateCards = page.locator('.candidate-card, [data-testid="candidate-card"], [class*="candidate"]');
        const cardCount = await candidateCards.count();
        console.log(`Result: ${cardCount} candidate cards found`);

        // Check for role violations
        if (testCase.expectations.noChiefOfficers) {
          const hasChiefOfficer = /chief officer/i.test(textContent || '');
          if (hasChiefOfficer) {
            console.log('❌ VIOLATION: Chief Officer found in Captain search');
          } else {
            console.log('✅ No Chief Officers in Captain search');
          }
          expect(hasChiefOfficer).toBe(false);
        }

        if (testCase.expectations.noJuniorStews) {
          const hasJuniorStew = /2nd stew|second stew|3rd stew|third stew/i.test(textContent || '');
          if (hasJuniorStew) {
            console.log('❌ VIOLATION: Junior Stewardess found in Chief Stew search');
          } else {
            console.log('✅ No Junior Stewardesses in Chief Stew search');
          }
        }

        if (testCase.expectations.noYachtCrew) {
          // Check if yacht-only roles are showing for childcare position
          const hasInappropriateRole = /deckhand|stewardess|bosun/i.test(textContent || '') &&
                                       !/nanny|childcare|governess|au pair/i.test(textContent || '');
          if (hasInappropriateRole) {
            console.log('❌ VIOLATION: Yacht crew without childcare exp found in Nanny search');
          }
        }

        if (testCase.expectations.noSousChefs) {
          const hasSousChef = /sous chef|junior chef|commis/i.test(textContent || '');
          if (hasSousChef) {
            console.log('❌ VIOLATION: Junior chef found in Head Chef search');
          } else {
            console.log('✅ No Junior chefs in Head Chef search');
          }
        }

        // Check for "0+ years" display issue
        const hasZeroYears = /\b0\+?\s*years?\s*(experience|exp)/i.test(textContent || '');
        if (hasZeroYears) {
          console.log('⚠️ WARNING: "0+ years" displayed (should show "Experience on file")');
        } else {
          console.log('✅ No "0+ years" display issue');
        }

        // Check score reasonableness - scores above 70% should indicate qualified candidates
        const scoreMatches = (textContent || '').match(/(\d{1,3})%/g) || [];
        const scores = scoreMatches.map(s => parseInt(s.replace('%', ''))).filter(s => s >= 50 && s <= 100);

        if (scores.length > 0) {
          console.log(`Scores found: ${scores.join(', ')}`);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          console.log(`Average score: ${avgScore.toFixed(1)}%`);
        }
      }

      console.log(`==========================================\n`);
    });
  }
});
