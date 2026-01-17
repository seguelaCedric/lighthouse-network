/**
 * YotSpot Search Adapter
 * Search for candidates on YotSpot's candidate database and return preview data
 * Full imports only happen when a candidate is added to shortlist
 */

import puppeteer, { Browser, Page } from "puppeteer";
import {
  YOTSPOT_URLS,
  YOTSPOT_TIMEOUTS,
  YOTSPOT_SELECTORS,
  PUPPETEER_CONFIG,
  getRandomDelay,
} from "./constants";
import type { YotspotScraperConfig } from "./types";

// =============================================================================
// Types
// =============================================================================

/**
 * Preview data for a YotSpot candidate (not full import)
 */
export interface YotSpotCandidatePreview {
  /** YotSpot profile URL */
  yotspotProfileUrl: string;
  /** YotSpot candidate ID extracted from URL */
  yotspotId: string | null;
  /** Full name */
  name: string;
  /** Primary position */
  position: string | null;
  /** Years of experience */
  yearsExperience: number | null;
  /** Availability status text */
  availability: string | null;
  /** Available from date */
  availableFrom: string | null;
  /** Nationality */
  nationality: string | null;
  /** Profile photo URL */
  photoUrl: string | null;
  /** Has STCW certification */
  hasSTCW: boolean;
  /** Has ENG1 certificate */
  hasENG1: boolean;
  /** Has Schengen visa */
  hasSchengen: boolean;
  /** Has B1/B2 visa */
  hasB1B2: boolean;
  /** Source identifier */
  source: "yotspot";
  /** When this preview was scraped */
  scrapedAt: string;
}

/**
 * Search filters for YotSpot candidate search
 */
export interface YotSpotSearchFilters {
  /** Position/role to search for */
  position?: string;
  /** Minimum years of experience */
  minExperience?: number;
  /** Required certifications */
  certifications?: string[];
  /** Required visas */
  visas?: string[];
  /** Available by date */
  availableBy?: string;
  /** Nationality filter */
  nationality?: string;
  /** Free text search query */
  query?: string;
}

/**
 * Search results from YotSpot
 */
export interface YotSpotSearchResult {
  /** Candidate previews found */
  candidates: YotSpotCandidatePreview[];
  /** Total found (may be more than returned) */
  totalFound: number;
  /** When the search was performed */
  searchedAt: string;
  /** Filters that were applied */
  appliedFilters: YotSpotSearchFilters;
}

// =============================================================================
// Search Selectors (need validation against actual YotSpot HTML)
// =============================================================================

const SEARCH_SELECTORS = {
  // Search page elements
  searchPage: {
    /** URL for candidate search */
    searchUrl: "https://www.yotspot.com/recruiter/candidates",
    /** Search input field */
    searchInput: [
      'input[name="search"]',
      'input[type="search"]',
      ".search-input",
      "#candidate-search",
    ],
    /** Position/role filter dropdown */
    positionFilter: [
      'select[name="position"]',
      ".position-filter",
      "#position-select",
    ],
    /** Experience filter */
    experienceFilter: [
      'select[name="experience"]',
      ".experience-filter",
      "#experience-select",
    ],
    /** Availability filter */
    availabilityFilter: [
      'select[name="availability"]',
      ".availability-filter",
      "#availability-select",
    ],
    /** Search submit button */
    searchButton: [
      'button[type="submit"]',
      ".search-submit",
      ".btn-search",
      "#search-btn",
    ],
    /** Results container */
    resultsContainer: [
      ".candidate-results",
      ".search-results",
      "#candidates-list",
      ".candidates-grid",
    ],
    /** No results message */
    noResults: [".no-results", ".empty-state", ".no-candidates"],
    /** Loading indicator */
    loading: [".loading", ".spinner", ".searching"],
    /** Total count display */
    totalCount: [".result-count", ".total-candidates", ".showing-count"],
  },

  // Individual candidate card in search results
  candidateCard: {
    /** Container for each candidate */
    container: [
      ".candidate-card",
      ".candidate-item",
      ".crew-card",
      "[data-candidate]",
    ],
    /** Link to profile */
    profileLink: ["a.candidate-link", "a[href*='candidate']", ".profile-link"],
    /** Name element */
    name: [".candidate-name", ".crew-name", "h3", "h4"],
    /** Position element */
    position: [".candidate-position", ".role", ".job-title"],
    /** Experience element */
    experience: [".experience", ".years-exp", ".exp-years"],
    /** Availability element */
    availability: [".availability", ".available", ".status"],
    /** Nationality element */
    nationality: [".nationality", ".flag", ".country"],
    /** Photo element */
    photo: ["img.candidate-photo", ".avatar img", ".photo img"],
    /** Certification badges */
    certBadges: [".certifications", ".badges", ".cert-badges"],
    /** STCW badge */
    stcwBadge: [".stcw", '[data-cert="stcw"]', ".has-stcw"],
    /** ENG1 badge */
    eng1Badge: [".eng1", '[data-cert="eng1"]', ".has-eng1"],
    /** Visa badges */
    visaBadges: [".visas", ".visa-badges"],
    /** Schengen badge */
    schengenBadge: [".schengen", '[data-visa="schengen"]'],
    /** B1/B2 badge */
    b1b2Badge: [".b1b2", '[data-visa="b1b2"]'],
  },
} as const;

// =============================================================================
// Search Adapter Class
// =============================================================================

export class YotSpotSearchAdapter {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private config: YotspotScraperConfig;

  constructor(config?: Partial<YotspotScraperConfig>) {
    this.config = {
      email: process.env.YOTSPOT_EMAIL || "",
      password: process.env.YOTSPOT_PASSWORD || "",
      headless: true,
      timeout: YOTSPOT_TIMEOUTS.NAVIGATION,
      minDelayMs: 2000,
      maxDelayMs: 5000,
      ...config,
    };

    if (!this.config.email || !this.config.password) {
      throw new Error(
        "YotSpot credentials not configured. Set YOTSPOT_EMAIL and YOTSPOT_PASSWORD environment variables."
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Browser Management
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.browser) return;

    console.log("[YotSpotSearch] Launching browser...");

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [...PUPPETEER_CONFIG.args],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(PUPPETEER_CONFIG.viewport);
    await this.page.setUserAgent(PUPPETEER_CONFIG.userAgent);
    this.page.setDefaultTimeout(this.config.timeout);

    console.log("[YotSpotSearch] Browser initialized");
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isLoggedIn = false;
      console.log("[YotSpotSearch] Browser closed");
    }
  }

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    if (this.isLoggedIn) {
      console.log("[YotSpotSearch] Already logged in");
      return true;
    }

    console.log("[YotSpotSearch] Logging in to YotSpot...");

    try {
      await this.page.goto(YOTSPOT_URLS.LOGIN, {
        waitUntil: "networkidle0",
        timeout: YOTSPOT_TIMEOUTS.LOGIN,
      });

      // Find and fill email
      const emailInput = await this.findElement(
        YOTSPOT_SELECTORS.login.emailInput
      );
      if (!emailInput) throw new Error("Could not find email input field");
      await emailInput.type(this.config.email, { delay: 50 });

      // Find and fill password
      const passwordInput = await this.findElement(
        YOTSPOT_SELECTORS.login.passwordInput
      );
      if (!passwordInput) throw new Error("Could not find password input field");
      await passwordInput.type(this.config.password, { delay: 50 });

      await this.delay(500);

      // Submit
      const submitButton = await this.findElement(
        YOTSPOT_SELECTORS.login.submitButton
      );
      if (!submitButton) throw new Error("Could not find submit button");

      await Promise.all([
        this.page.waitForNavigation({
          waitUntil: "networkidle0",
          timeout: YOTSPOT_TIMEOUTS.LOGIN,
        }),
        submitButton.click(),
      ]);

      // Check for errors
      const errorElement = await this.findElement(
        YOTSPOT_SELECTORS.login.errorMessage
      );
      if (errorElement) {
        const errorText = await errorElement.evaluate(
          (el) => el.textContent?.trim() || ""
        );
        if (errorText) throw new Error(`Login failed: ${errorText}`);
      }

      this.isLoggedIn = true;
      console.log("[YotSpotSearch] Login successful");
      await this.delay(getRandomDelay());

      return true;
    } catch (error) {
      console.error("[YotSpotSearch] Login failed:", error);
      this.isLoggedIn = false;
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Search Methods
  // ---------------------------------------------------------------------------

  /**
   * Search for candidates matching the given filters
   */
  async searchCandidates(
    filters: YotSpotSearchFilters,
    limit = 20
  ): Promise<YotSpotSearchResult> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    if (!this.isLoggedIn) {
      await this.login();
    }

    console.log("[YotSpotSearch] Searching for candidates...", filters);

    // Navigate to search page
    await this.page.goto(SEARCH_SELECTORS.searchPage.searchUrl, {
      waitUntil: "networkidle0",
      timeout: YOTSPOT_TIMEOUTS.NAVIGATION,
    });

    await this.delay(2000);

    // Apply filters
    await this.applyFilters(filters);

    // Click search
    const searchButton = await this.findElement(
      SEARCH_SELECTORS.searchPage.searchButton
    );
    if (searchButton) {
      await searchButton.click();
      await this.delay(3000); // Wait for results
    }

    // Wait for results to load
    await this.waitForResults();

    // Extract preview data from results
    const candidates = await this.extractSearchResults(limit);

    // Get total count if available
    const totalFound = await this.getTotalCount() || candidates.length;

    return {
      candidates,
      totalFound,
      searchedAt: new Date().toISOString(),
      appliedFilters: filters,
    };
  }

  /**
   * Scrape preview data for a single candidate profile
   * (lighter weight than full scrape, for search results)
   */
  async scrapePreview(profileUrl: string): Promise<YotSpotCandidatePreview> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    if (!this.isLoggedIn) {
      await this.login();
    }

    console.log(`[YotSpotSearch] Scraping preview from: ${profileUrl}`);

    await this.page.goto(profileUrl, {
      waitUntil: "networkidle0",
      timeout: YOTSPOT_TIMEOUTS.SCRAPE,
    });

    await this.delay(2000);

    const selectors = YOTSPOT_SELECTORS.profile;

    const fullName = await this.getTextContent(selectors.candidateName);
    const preview: YotSpotCandidatePreview = {
      yotspotProfileUrl: profileUrl,
      yotspotId: this.extractIdFromUrl(profileUrl),
      name: fullName || "Unknown",
      position: await this.getTextContent(selectors.position),
      yearsExperience: await this.getNumberContent(selectors.experience),
      availability: await this.getTextContent(selectors.availabilityStatus),
      availableFrom: await this.getTextContent(selectors.availableFrom),
      nationality: await this.getTextContent(selectors.nationality),
      photoUrl: await this.getSrc(selectors.photo),
      hasSTCW: await this.hasElement(selectors.stcw),
      hasENG1: await this.hasElement(selectors.eng1),
      hasSchengen: await this.hasElement(selectors.schengen),
      hasB1B2: await this.hasElement(selectors.b1b2),
      source: "yotspot",
      scrapedAt: new Date().toISOString(),
    };

    await this.delay(getRandomDelay());

    return preview;
  }

  // ---------------------------------------------------------------------------
  // Filter Application
  // ---------------------------------------------------------------------------

  private async applyFilters(filters: YotSpotSearchFilters): Promise<void> {
    if (!this.page) return;

    // Apply search query
    if (filters.query || filters.position) {
      const searchInput = await this.findElement(
        SEARCH_SELECTORS.searchPage.searchInput
      );
      if (searchInput) {
        const searchText = filters.query || filters.position || "";
        await searchInput.type(searchText, { delay: 30 });
      }
    }

    // Apply position filter if dropdown exists
    if (filters.position) {
      const positionSelect = await this.findElement(
        SEARCH_SELECTORS.searchPage.positionFilter
      );
      if (positionSelect) {
        try {
          await this.page.select(
            SEARCH_SELECTORS.searchPage.positionFilter[0],
            filters.position
          );
        } catch {
          // Filter might not have the exact option
          console.log(
            "[YotSpotSearch] Position filter not available or no match"
          );
        }
      }
    }

    // Apply experience filter
    if (filters.minExperience) {
      const expSelect = await this.findElement(
        SEARCH_SELECTORS.searchPage.experienceFilter
      );
      if (expSelect) {
        try {
          await this.page.select(
            SEARCH_SELECTORS.searchPage.experienceFilter[0],
            String(filters.minExperience)
          );
        } catch {
          console.log(
            "[YotSpotSearch] Experience filter not available or no match"
          );
        }
      }
    }

    await this.delay(500);
  }

  // ---------------------------------------------------------------------------
  // Results Extraction
  // ---------------------------------------------------------------------------

  private async waitForResults(): Promise<void> {
    if (!this.page) return;

    try {
      // Wait for either results or no-results message
      await Promise.race([
        this.page.waitForSelector(
          SEARCH_SELECTORS.searchPage.resultsContainer.join(", "),
          { timeout: 10000 }
        ),
        this.page.waitForSelector(
          SEARCH_SELECTORS.searchPage.noResults.join(", "),
          { timeout: 10000 }
        ),
      ]);
    } catch {
      console.log("[YotSpotSearch] Results container not found, continuing...");
    }
  }

  private async extractSearchResults(
    limit: number
  ): Promise<YotSpotCandidatePreview[]> {
    if (!this.page) return [];

    const candidates: YotSpotCandidatePreview[] = [];

    try {
      // Find all candidate cards
      const cardSelector = SEARCH_SELECTORS.candidateCard.container.join(", ");
      const cards = await this.page.$$(cardSelector);

      console.log(`[YotSpotSearch] Found ${cards.length} candidate cards`);

      for (const card of cards.slice(0, limit)) {
        try {
          const preview = await this.extractCardData(card);
          if (preview) {
            candidates.push(preview);
          }
        } catch (error) {
          console.warn(
            "[YotSpotSearch] Error extracting candidate card:",
            error
          );
        }
      }
    } catch (error) {
      console.error("[YotSpotSearch] Error extracting search results:", error);
    }

    return candidates;
  }

  private async extractCardData(
    card: Awaited<ReturnType<Page["$"]>>
  ): Promise<YotSpotCandidatePreview | null> {
    if (!card) return null;

    // Get profile link
    const profileLink = await card.$(
      SEARCH_SELECTORS.candidateCard.profileLink.join(", ")
    );
    const profileUrl = profileLink
      ? await profileLink.evaluate(
          (el) => (el as HTMLAnchorElement).href || ""
        )
      : "";

    if (!profileUrl) return null;

    // Extract data from card
    const name = await this.getTextFromElement(
      card,
      SEARCH_SELECTORS.candidateCard.name
    );
    const position = await this.getTextFromElement(
      card,
      SEARCH_SELECTORS.candidateCard.position
    );
    const experience = await this.getTextFromElement(
      card,
      SEARCH_SELECTORS.candidateCard.experience
    );
    const availability = await this.getTextFromElement(
      card,
      SEARCH_SELECTORS.candidateCard.availability
    );
    const nationality = await this.getTextFromElement(
      card,
      SEARCH_SELECTORS.candidateCard.nationality
    );

    // Get photo
    const photoEl = await card.$(
      SEARCH_SELECTORS.candidateCard.photo.join(", ")
    );
    const photoUrl = photoEl
      ? await photoEl.evaluate((el) => (el as HTMLImageElement).src || null)
      : null;

    // Check certifications
    const hasSTCW = !!(await card.$(
      SEARCH_SELECTORS.candidateCard.stcwBadge.join(", ")
    ));
    const hasENG1 = !!(await card.$(
      SEARCH_SELECTORS.candidateCard.eng1Badge.join(", ")
    ));
    const hasSchengen = !!(await card.$(
      SEARCH_SELECTORS.candidateCard.schengenBadge.join(", ")
    ));
    const hasB1B2 = !!(await card.$(
      SEARCH_SELECTORS.candidateCard.b1b2Badge.join(", ")
    ));

    // Parse experience years
    let yearsExp: number | null = null;
    if (experience) {
      const match = experience.match(/\d+/);
      if (match) yearsExp = parseInt(match[0], 10);
    }

    return {
      yotspotProfileUrl: profileUrl,
      yotspotId: this.extractIdFromUrl(profileUrl),
      name: name || "Unknown",
      position,
      yearsExperience: yearsExp,
      availability,
      availableFrom: null, // Not typically shown in card
      nationality,
      photoUrl,
      hasSTCW,
      hasENG1,
      hasSchengen,
      hasB1B2,
      source: "yotspot",
      scrapedAt: new Date().toISOString(),
    };
  }

  private async getTotalCount(): Promise<number | null> {
    if (!this.page) return null;

    const countEl = await this.findElement(
      SEARCH_SELECTORS.searchPage.totalCount
    );
    if (!countEl) return null;

    const text = await countEl.evaluate((el) => el.textContent?.trim() || "");
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  // ---------------------------------------------------------------------------
  // Helper Methods
  // ---------------------------------------------------------------------------

  private async findElement(
    selectors: readonly string[]
  ): Promise<Awaited<ReturnType<Page["$"]>> | null> {
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

  private async hasElement(selectors: readonly string[]): Promise<boolean> {
    const element = await this.findElement(selectors);
    return element !== null;
  }

  private async getTextContent(
    selectors: readonly string[]
  ): Promise<string | null> {
    const element = await this.findElement(selectors);
    if (!element) return null;

    const text = await element.evaluate((el) => el.textContent?.trim() || "");
    return text || null;
  }

  private async getTextFromElement(
    parent: NonNullable<Awaited<ReturnType<Page["$"]>>>,
    selectors: readonly string[]
  ): Promise<string | null> {
    for (const selector of selectors) {
      try {
        const element = await parent.$(selector);
        if (element) {
          const text = await element.evaluate(
            (el) => el.textContent?.trim() || ""
          );
          if (text) return text;
        }
      } catch {
        // Try next selector
      }
    }
    return null;
  }

  private async getNumberContent(
    selectors: readonly string[]
  ): Promise<number | null> {
    const text = await this.getTextContent(selectors);
    if (!text) return null;

    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  private async getSrc(selectors: readonly string[]): Promise<string | null> {
    const element = await this.findElement(selectors);
    if (!element) return null;

    const src = await element.evaluate((el) =>
      el instanceof HTMLImageElement ? el.src : null
    );
    return src;
  }

  private extractIdFromUrl(url: string): string | null {
    const match = url.match(/(?:applicant|candidate|profile)[\/\-](\d+)/i);
    return match ? match[1] : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Search YotSpot for candidates (one-off search)
 */
export async function searchYotSpotCandidates(
  filters: YotSpotSearchFilters,
  limit = 20
): Promise<YotSpotSearchResult> {
  const adapter = new YotSpotSearchAdapter();

  try {
    await adapter.initialize();
    await adapter.login();
    return await adapter.searchCandidates(filters, limit);
  } finally {
    await adapter.close();
  }
}

/**
 * Scrape preview data for a single YotSpot candidate
 */
export async function scrapeYotSpotPreview(
  profileUrl: string
): Promise<YotSpotCandidatePreview> {
  const adapter = new YotSpotSearchAdapter();

  try {
    await adapter.initialize();
    await adapter.login();
    return await adapter.scrapePreview(profileUrl);
  } finally {
    await adapter.close();
  }
}
