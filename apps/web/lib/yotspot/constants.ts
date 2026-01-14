/**
 * Yotspot Integration Constants
 * URLs, selectors, and configuration for the Yotspot scraper
 *
 * NOTE: CSS selectors may need adjustment based on actual Yotspot HTML structure.
 * These are initial best-guesses that should be validated during testing.
 */

// =============================================================================
// URLs
// =============================================================================

export const YOTSPOT_URLS = {
  BASE: 'https://www.yotspot.com',
  LOGIN: 'https://www.yotspot.com/login',
  DASHBOARD: 'https://www.yotspot.com/dashboard',
  LOGOUT: 'https://www.yotspot.com/logout',
} as const;

// =============================================================================
// Timeouts (in milliseconds)
// =============================================================================

export const YOTSPOT_TIMEOUTS = {
  /** Timeout for login process */
  LOGIN: 30_000,
  /** Timeout for page navigation */
  NAVIGATION: 30_000,
  /** Timeout for scraping a candidate profile */
  SCRAPE: 60_000,
  /** Timeout for file downloads */
  DOWNLOAD: 30_000,
  /** Wait for network to be idle */
  NETWORK_IDLE: 10_000,
} as const;

// =============================================================================
// Rate Limiting
// =============================================================================

export const YOTSPOT_RATE_LIMITS = {
  /** Minimum delay between requests (ms) */
  MIN_DELAY: 2_000,
  /** Maximum delay between requests (ms) */
  MAX_DELAY: 5_000,
  /** Delay after login before navigating */
  POST_LOGIN_DELAY: 3_000,
  /** Maximum candidates to process per cron run */
  MAX_PER_BATCH: 5,
} as const;

// =============================================================================
// Retry Configuration
// =============================================================================

export const YOTSPOT_RETRY = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,
  /** Retry delays in milliseconds (exponential backoff) */
  DELAYS: [
    5 * 60 * 1000, // 5 minutes
    30 * 60 * 1000, // 30 minutes
    2 * 60 * 60 * 1000, // 2 hours
  ],
} as const;

// =============================================================================
// CSS Selectors
// =============================================================================
// NOTE: These selectors are placeholders and need validation against actual Yotspot HTML

export const YOTSPOT_SELECTORS = {
  // -------------------------------------------------------------------------
  // Login Page
  // -------------------------------------------------------------------------
  login: {
    /** Email input field */
    emailInput: [
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      '.login-email',
    ],
    /** Password input field */
    passwordInput: [
      'input[name="password"]',
      'input[type="password"]',
      '#password',
      '.login-password',
    ],
    /** Submit button */
    submitButton: [
      'button[type="submit"]',
      'input[type="submit"]',
      '.login-submit',
      '.btn-login',
    ],
    /** Error message element */
    errorMessage: ['.login-error', '.error-message', '.alert-danger'],
    /** Success indicator (element present after login) */
    successIndicator: ['.dashboard', '.user-menu', '.logged-in'],
  },

  // -------------------------------------------------------------------------
  // Candidate Profile Page
  // -------------------------------------------------------------------------
  profile: {
    // Identity
    candidateName: [
      '.candidate-name',
      '.profile-name',
      'h1.name',
      '[data-field="name"]',
    ],
    firstName: ['[data-field="first_name"]', '.first-name'],
    lastName: ['[data-field="last_name"]', '.last-name'],

    // Contact
    email: [
      '.candidate-email',
      '[data-field="email"]',
      'a[href^="mailto:"]',
      '.contact-email',
    ],
    phone: [
      '.candidate-phone',
      '[data-field="phone"]',
      'a[href^="tel:"]',
      '.contact-phone',
    ],
    whatsapp: ['[data-field="whatsapp"]', '.whatsapp-number'],

    // Personal
    nationality: [
      '[data-field="nationality"]',
      '.nationality',
      '.candidate-nationality',
    ],
    dateOfBirth: ['[data-field="dob"]', '.date-of-birth', '.dob'],
    gender: ['[data-field="gender"]', '.gender'],
    location: [
      '[data-field="location"]',
      '.current-location',
      '.candidate-location',
    ],

    // Professional
    position: [
      '.primary-position',
      '[data-field="position"]',
      '.job-title',
      '.candidate-position',
    ],
    experience: [
      '[data-field="experience"]',
      '.years-experience',
      '.experience-years',
    ],
    summary: ['.profile-summary', '.bio', '.about', '[data-field="summary"]'],

    // Availability
    availabilityStatus: [
      '.availability-status',
      '[data-field="availability"]',
      '.candidate-availability',
    ],
    availableFrom: [
      '[data-field="available_from"]',
      '.available-from',
      '.availability-date',
    ],

    // Certifications
    stcw: ['[data-cert="stcw"]', '.stcw-status', '.has-stcw'],
    eng1: ['[data-cert="eng1"]', '.eng1-status', '.has-eng1'],
    certificationsContainer: [
      '.certifications',
      '.certificates-list',
      '[data-section="certifications"]',
    ],
    certificationItem: ['.certification-item', '.certificate', '.cert-row'],

    // Visas
    schengen: ['[data-visa="schengen"]', '.has-schengen'],
    b1b2: ['[data-visa="b1b2"]', '.has-b1b2'],
    visasContainer: ['.visas', '.visa-list', '[data-section="visas"]'],
    visaItem: ['.visa-item', '.visa', '.visa-row'],

    // Preferences
    preferredYachtSize: ['[data-field="yacht_size"]', '.preferred-yacht-size'],
    preferredYachtType: ['[data-field="yacht_type"]', '.preferred-yacht-type'],
    salaryExpectation: ['[data-field="salary"]', '.salary-expectation'],

    // Personal attributes
    smoker: ['[data-field="smoker"]', '.smoker-status'],
    tattoos: ['[data-field="tattoos"]', '.tattoo-status'],
    languages: ['.languages', '[data-section="languages"]', '.language-list'],

    // Work history
    workHistoryContainer: [
      '.work-history',
      '.experience-list',
      '[data-section="experience"]',
    ],
    workHistoryItem: ['.experience-item', '.work-item', '.job-entry'],

    // Documents
    cvDownload: [
      'a[href*="cv"]',
      'a[href*="resume"]',
      '.download-cv',
      '.cv-link',
      'a[download*="cv"]',
    ],
    photo: [
      '.candidate-photo img',
      '.profile-photo img',
      '.avatar img',
      '.photo img',
    ],
  },

  // -------------------------------------------------------------------------
  // Common Elements
  // -------------------------------------------------------------------------
  common: {
    /** Loading spinner */
    loading: ['.loading', '.spinner', '.loader', '[data-loading]'],
    /** Pagination */
    pagination: ['.pagination', '.pager', '.page-navigation'],
    /** Modal/popup */
    modal: ['.modal', '.popup', '.dialog'],
    /** Close button */
    closeButton: ['.close', '.btn-close', '[aria-label="Close"]'],
  },
} as const;

// =============================================================================
// Puppeteer Browser Configuration
// =============================================================================

export const PUPPETEER_CONFIG = {
  /** Launch arguments for headless Chrome */
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--window-size=1920,1080',
  ],
  /** Viewport size */
  viewport: {
    width: 1920,
    height: 1080,
  },
  /** User agent string */
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
} as const;

// =============================================================================
// Match Score Thresholds
// =============================================================================

export const MATCH_THRESHOLDS = {
  /** Minimum score to notify team */
  NOTIFY: 70,
  /** Score considered excellent */
  EXCELLENT: 90,
  /** Score considered good */
  GOOD: 80,
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a random delay between min and max for rate limiting
 */
export function getRandomDelay(
  min = YOTSPOT_RATE_LIMITS.MIN_DELAY,
  max = YOTSPOT_RATE_LIMITS.MAX_DELAY
): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get the retry delay for a given attempt number
 */
export function getRetryDelay(attempt: number): number {
  const delays = YOTSPOT_RETRY.DELAYS;
  return delays[Math.min(attempt, delays.length - 1)];
}

/**
 * Calculate when to retry based on attempt number
 */
export function calculateNextRetryAt(attempt: number): Date {
  const delay = getRetryDelay(attempt);
  return new Date(Date.now() + delay);
}
