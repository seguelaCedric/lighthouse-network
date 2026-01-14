/**
 * Yotspot Scraper
 * Puppeteer-based scraper for extracting candidate data from Yotspot job board
 */

import puppeteer, { Browser, Page, ElementHandle } from 'puppeteer';
import {
  ScrapedCandidate,
  YotspotWorkExperience,
  YotspotCertification,
  YotspotScraperConfig,
} from './types';
import {
  YOTSPOT_URLS,
  YOTSPOT_TIMEOUTS,
  YOTSPOT_SELECTORS,
  PUPPETEER_CONFIG,
  getRandomDelay,
} from './constants';

// =============================================================================
// Scraper Class
// =============================================================================

export class YotspotScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private config: YotspotScraperConfig;

  constructor(config?: Partial<YotspotScraperConfig>) {
    this.config = {
      email: process.env.YOTSPOT_EMAIL || '',
      password: process.env.YOTSPOT_PASSWORD || '',
      headless: true,
      timeout: YOTSPOT_TIMEOUTS.NAVIGATION,
      minDelayMs: 2000,
      maxDelayMs: 5000,
      ...config,
    };

    if (!this.config.email || !this.config.password) {
      throw new Error(
        'Yotspot credentials not configured. Set YOTSPOT_EMAIL and YOTSPOT_PASSWORD environment variables.'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Browser Management
  // ---------------------------------------------------------------------------

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    console.log('[YotspotScraper] Launching browser...');

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [...PUPPETEER_CONFIG.args],
    });

    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport(PUPPETEER_CONFIG.viewport);

    // Set user agent
    await this.page.setUserAgent(PUPPETEER_CONFIG.userAgent);

    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout);

    console.log('[YotspotScraper] Browser initialized');
  }

  /**
   * Close the browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
      console.log('[YotspotScraper] Browser closed');
    }
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  /**
   * Login to Yotspot with stored credentials
   */
  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    if (this.isLoggedIn) {
      console.log('[YotspotScraper] Already logged in');
      return true;
    }

    console.log('[YotspotScraper] Logging in to Yotspot...');

    try {
      // Navigate to login page
      await this.page.goto(YOTSPOT_URLS.LOGIN, {
        waitUntil: 'networkidle0',
        timeout: YOTSPOT_TIMEOUTS.LOGIN,
      });

      // Find and fill email field
      const emailInput = await this.findElement(
        YOTSPOT_SELECTORS.login.emailInput
      );
      if (!emailInput) {
        throw new Error('Could not find email input field');
      }
      await emailInput.type(this.config.email, { delay: 50 });

      // Find and fill password field
      const passwordInput = await this.findElement(
        YOTSPOT_SELECTORS.login.passwordInput
      );
      if (!passwordInput) {
        throw new Error('Could not find password input field');
      }
      await passwordInput.type(this.config.password, { delay: 50 });

      // Small delay before clicking submit
      await this.delay(500);

      // Find and click submit button
      const submitButton = await this.findElement(
        YOTSPOT_SELECTORS.login.submitButton
      );
      if (!submitButton) {
        throw new Error('Could not find submit button');
      }

      // Click and wait for navigation
      await Promise.all([
        this.page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: YOTSPOT_TIMEOUTS.LOGIN,
        }),
        submitButton.click(),
      ]);

      // Check for login errors
      const errorElement = await this.findElement(
        YOTSPOT_SELECTORS.login.errorMessage
      );
      if (errorElement) {
        const errorText = await errorElement.evaluate(
          (el) => el.textContent?.trim() || ''
        );
        if (errorText) {
          throw new Error(`Login failed: ${errorText}`);
        }
      }

      // Verify login success by checking for success indicator
      const successIndicator = await this.findElement(
        YOTSPOT_SELECTORS.login.successIndicator
      );
      if (!successIndicator) {
        // Check URL as fallback
        const currentUrl = this.page.url();
        if (
          currentUrl.includes('login') ||
          !currentUrl.includes(YOTSPOT_URLS.BASE)
        ) {
          throw new Error('Login appears to have failed - still on login page');
        }
      }

      this.isLoggedIn = true;
      console.log('[YotspotScraper] Login successful');

      // Add delay after login
      await this.delay(getRandomDelay());

      return true;
    } catch (error) {
      console.error('[YotspotScraper] Login failed:', error);
      this.isLoggedIn = false;
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Candidate Scraping
  // ---------------------------------------------------------------------------

  /**
   * Scrape a candidate profile from the given URL
   */
  async scrapeCandidate(applicantUrl: string): Promise<ScrapedCandidate> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    if (!this.isLoggedIn) {
      await this.login();
    }

    console.log(`[YotspotScraper] Scraping candidate from: ${applicantUrl}`);

    // Navigate to candidate profile
    await this.page.goto(applicantUrl, {
      waitUntil: 'networkidle0',
      timeout: YOTSPOT_TIMEOUTS.SCRAPE,
    });

    // Wait for page content to load
    await this.delay(2000);

    // Extract candidate data
    const candidate = await this.extractCandidateData();

    // Add rate limiting delay
    await this.delay(getRandomDelay());

    return candidate;
  }

  /**
   * Extract candidate data from the current page
   */
  private async extractCandidateData(): Promise<ScrapedCandidate> {
    if (!this.page) {
      throw new Error('Page not available');
    }

    const selectors = YOTSPOT_SELECTORS.profile;

    // Extract basic information
    const fullName = await this.getTextContent(selectors.candidateName);
    const nameParts = this.parseFullName(fullName || '');

    const candidate: ScrapedCandidate = {
      // Identity
      yotspotId: this.extractIdFromUrl(this.page.url()),
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      fullName: fullName || '',

      // Contact
      email: await this.getTextContent(selectors.email),
      phone: await this.getTextContent(selectors.phone),
      whatsapp: await this.getTextContent(selectors.whatsapp),

      // Personal
      nationality: await this.getTextContent(selectors.nationality),
      dateOfBirth: await this.getTextContent(selectors.dateOfBirth),
      gender: await this.getTextContent(selectors.gender),
      currentLocation: await this.getTextContent(selectors.location),

      // Professional
      primaryPosition: await this.getTextContent(selectors.position),
      secondaryPositions: [],
      yearsExperience: await this.getNumberContent(selectors.experience),
      profileSummary: await this.getTextContent(selectors.summary),

      // Availability
      availabilityStatus: await this.getTextContent(
        selectors.availabilityStatus
      ),
      availableFrom: await this.getTextContent(selectors.availableFrom),

      // Certifications
      hasStcw: await this.hasElement(selectors.stcw),
      hasEng1: await this.hasElement(selectors.eng1),
      certifications: await this.extractCertifications(),
      licenses: [],

      // Visas
      hasSchengen: await this.hasElement(selectors.schengen),
      hasB1B2: await this.hasElement(selectors.b1b2),
      visas: [],

      // Preferences
      preferredYachtSize: await this.getTextContent(
        selectors.preferredYachtSize
      ),
      preferredYachtType: await this.getTextContent(
        selectors.preferredYachtType
      ),
      preferredContractType: null,
      salaryExpectation: await this.getTextContent(selectors.salaryExpectation),

      // Personal attributes
      isSmoker: await this.getBooleanContent(selectors.smoker),
      hasVisibleTattoos: await this.getBooleanContent(selectors.tattoos),
      languages: await this.extractLanguages(),

      // Documents
      cvDownloadUrl: await this.getHref(selectors.cvDownload),
      photoUrl: await this.getSrc(selectors.photo),

      // Work history
      workHistory: await this.extractWorkHistory(),

      // Metadata
      scrapedAt: new Date().toISOString(),
    };

    return candidate;
  }

  /**
   * Extract certifications from the page
   */
  private async extractCertifications(): Promise<YotspotCertification[]> {
    if (!this.page) return [];

    const certifications: YotspotCertification[] = [];
    const selectors = YOTSPOT_SELECTORS.profile;

    try {
      const container = await this.findElement(
        selectors.certificationsContainer
      );
      if (!container) return certifications;

      const items = await container.$$(selectors.certificationItem.join(', '));

      for (const item of items) {
        const name = await item.evaluate(
          (el) => el.textContent?.trim() || ''
        );
        if (name) {
          certifications.push({
            name,
            issueDate: null,
            expiryDate: null,
            issuingAuthority: null,
          });
        }
      }
    } catch (error) {
      console.warn('[YotspotScraper] Error extracting certifications:', error);
    }

    return certifications;
  }

  /**
   * Extract work history from the page
   */
  private async extractWorkHistory(): Promise<YotspotWorkExperience[]> {
    if (!this.page) return [];

    const workHistory: YotspotWorkExperience[] = [];
    const selectors = YOTSPOT_SELECTORS.profile;

    try {
      const container = await this.findElement(selectors.workHistoryContainer);
      if (!container) return workHistory;

      const items = await container.$$(selectors.workHistoryItem.join(', '));

      for (const item of items) {
        const text = await item.evaluate(
          (el) => el.textContent?.trim() || ''
        );
        // Basic parsing - would need refinement based on actual HTML structure
        workHistory.push({
          yachtName: text,
          position: '',
          yachtSize: null,
          yachtType: null,
          startDate: null,
          endDate: null,
          description: null,
        });
      }
    } catch (error) {
      console.warn('[YotspotScraper] Error extracting work history:', error);
    }

    return workHistory;
  }

  /**
   * Extract languages from the page
   */
  private async extractLanguages(): Promise<string[]> {
    if (!this.page) return [];

    const languages: string[] = [];
    const selectors = YOTSPOT_SELECTORS.profile;

    try {
      const container = await this.findElement(selectors.languages);
      if (!container) return languages;

      const text = await container.evaluate(
        (el) => el.textContent?.trim() || ''
      );
      // Split by common delimiters
      const parts = text.split(/[,;\n]/);
      for (const part of parts) {
        const lang = part.trim();
        if (lang) {
          languages.push(lang);
        }
      }
    } catch (error) {
      console.warn('[YotspotScraper] Error extracting languages:', error);
    }

    return languages;
  }

  // ---------------------------------------------------------------------------
  // File Downloads
  // ---------------------------------------------------------------------------

  /**
   * Download the CV file from Yotspot
   */
  async downloadCV(cvUrl: string): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`[YotspotScraper] Downloading CV from: ${cvUrl}`);

    // Get cookies for authenticated request
    const cookies = await this.page.cookies();
    const cookieString = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    // Download using fetch with cookies
    const response = await fetch(cvUrl, {
      headers: {
        Cookie: cookieString,
        'User-Agent': PUPPETEER_CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download CV: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Download a photo from Yotspot
   */
  async downloadPhoto(photoUrl: string): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    console.log(`[YotspotScraper] Downloading photo from: ${photoUrl}`);

    const cookies = await this.page.cookies();
    const cookieString = cookies
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const response = await fetch(photoUrl, {
      headers: {
        Cookie: cookieString,
        'User-Agent': PUPPETEER_CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download photo: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  /**
   * Find an element using multiple fallback selectors
   */
  private async findElement(
    selectors: readonly string[]
  ): Promise<ElementHandle | null> {
    if (!this.page) return null;

    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) return element;
      } catch {
        // Selector didn't work, try next
      }
    }
    return null;
  }

  /**
   * Check if an element exists on the page
   */
  private async hasElement(selectors: readonly string[]): Promise<boolean> {
    const element = await this.findElement(selectors);
    return element !== null;
  }

  /**
   * Get text content from an element
   */
  private async getTextContent(
    selectors: readonly string[]
  ): Promise<string | null> {
    const element = await this.findElement(selectors);
    if (!element) return null;

    const text = await element.evaluate((el) => el.textContent?.trim() || '');
    return text || null;
  }

  /**
   * Get numeric content from an element
   */
  private async getNumberContent(
    selectors: readonly string[]
  ): Promise<number | null> {
    const text = await this.getTextContent(selectors);
    if (!text) return null;

    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  /**
   * Get boolean content (yes/no, true/false) from an element
   */
  private async getBooleanContent(
    selectors: readonly string[]
  ): Promise<boolean | null> {
    const text = await this.getTextContent(selectors);
    if (!text) return null;

    const lower = text.toLowerCase();
    if (lower.includes('yes') || lower.includes('true')) return true;
    if (lower.includes('no') || lower.includes('false')) return false;
    return null;
  }

  /**
   * Get href attribute from a link element
   */
  private async getHref(selectors: readonly string[]): Promise<string | null> {
    const element = await this.findElement(selectors);
    if (!element) return null;

    const href = await element.evaluate((el) =>
      el instanceof HTMLAnchorElement ? el.href : null
    );
    return href;
  }

  /**
   * Get src attribute from an image element
   */
  private async getSrc(selectors: readonly string[]): Promise<string | null> {
    const element = await this.findElement(selectors);
    if (!element) return null;

    const src = await element.evaluate((el) =>
      el instanceof HTMLImageElement ? el.src : null
    );
    return src;
  }

  /**
   * Parse a full name into first and last name
   */
  private parseFullName(fullName: string): {
    firstName: string;
    lastName: string;
  } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  /**
   * Extract candidate ID from URL
   */
  private extractIdFromUrl(url: string): string | null {
    // Try to extract ID from URL patterns like /applicant/123 or /candidate/123
    const match = url.match(/(?:applicant|candidate|profile)[\/\-](\d+)/i);
    return match ? match[1] : null;
  }

  /**
   * Add a delay (for rate limiting)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Create a scraper instance, scrape a candidate, and close the browser
 * Useful for one-off scrapes
 */
export async function scrapeCandidate(
  applicantUrl: string
): Promise<ScrapedCandidate> {
  const scraper = new YotspotScraper();

  try {
    await scraper.initialize();
    await scraper.login();
    return await scraper.scrapeCandidate(applicantUrl);
  } finally {
    await scraper.close();
  }
}

/**
 * Scrape a candidate and download their CV
 */
export async function scrapeCandidateWithCV(
  applicantUrl: string
): Promise<{ candidate: ScrapedCandidate; cvBuffer: Buffer | null }> {
  const scraper = new YotspotScraper();

  try {
    await scraper.initialize();
    await scraper.login();

    const candidate = await scraper.scrapeCandidate(applicantUrl);

    let cvBuffer: Buffer | null = null;
    if (candidate.cvDownloadUrl) {
      try {
        cvBuffer = await scraper.downloadCV(candidate.cvDownloadUrl);
      } catch (error) {
        console.warn('[YotspotScraper] Failed to download CV:', error);
      }
    }

    return { candidate, cvBuffer };
  } finally {
    await scraper.close();
  }
}
