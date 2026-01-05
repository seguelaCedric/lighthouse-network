/**
 * Job Description Formatting Utilities
 *
 * Sanitizes and formats job descriptions from Vincere,
 * which often contain HTML tags, poor formatting, and placeholder text.
 */

/**
 * Placeholder texts that indicate no real description was provided
 */
const PLACEHOLDER_PATTERNS = [
  /^<p>no job description added<\/p>$/i,
  /^no job description added$/i,
  /^<p>no description<\/p>$/i,
  /^no description$/i,
  /^<p>n\/a<\/p>$/i,
  /^n\/a$/i,
  /^<p>tba<\/p>$/i,
  /^tba$/i,
  /^<p>tbc<\/p>$/i,
  /^tbc$/i,
  /^-$/,
  /^\.$/,
];

/**
 * Check if a description is just placeholder text
 */
function isPlaceholder(text: string): boolean {
  const trimmed = text.trim();
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  // Replace common HTML entities
  let text = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&bull;/gi, '•');

  // Convert <br> tags to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Convert block-level elements to double newlines for proper paragraph spacing
  text = text.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n\n');

  // Convert list items to bullet points
  text = text.replace(/<li[^>]*>/gi, '• ');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  return text;
}

/**
 * Clean up whitespace and formatting
 */
function cleanWhitespace(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Collapse multiple consecutive newlines into max 2 (paragraph break)
    .replace(/\n{3,}/g, '\n\n')
    // Remove multiple spaces
    .replace(/ {2,}/g, ' ')
    // Remove leading/trailing whitespace from the whole text
    .trim();
}

/**
 * Capitalize first letter of sentences
 */
function capitalizeSentences(text: string): string {
  // Capitalize first letter of text
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Capitalize after sentence-ending punctuation
  return text.replace(/([.!?])\s+([a-z])/g, (_, punct, letter) =>
    `${punct} ${letter.toUpperCase()}`
  );
}

export interface FormatDescriptionOptions {
  /** Maximum length for the description (truncates with ellipsis) */
  maxLength?: number;
  /** Whether to preserve paragraph breaks (double newlines) */
  preserveParagraphs?: boolean;
  /** Custom placeholder text to return if description is empty/placeholder */
  emptyText?: string | null;
}

/**
 * Format and sanitize a job description from Vincere
 *
 * @param description - Raw description from Vincere (may contain HTML)
 * @param options - Formatting options
 * @returns Cleaned and formatted description, or null if it's a placeholder
 */
export function formatDescription(
  description: string | null | undefined,
  options: FormatDescriptionOptions = {}
): string | null {
  const {
    maxLength,
    preserveParagraphs = true,
    emptyText = null,
  } = options;

  // Handle null/undefined
  if (!description) {
    return emptyText;
  }

  // Check for placeholder text before processing
  if (isPlaceholder(description)) {
    return emptyText;
  }

  // Strip HTML tags
  let text = stripHtml(description);

  // Clean up whitespace
  text = cleanWhitespace(text);

  // Check again after cleaning (might be empty now)
  if (!text || isPlaceholder(text)) {
    return emptyText;
  }

  // Capitalize sentences
  text = capitalizeSentences(text);

  // Collapse to single lines if not preserving paragraphs
  if (!preserveParagraphs) {
    text = text.replace(/\n+/g, ' ');
  }

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    // Find a good break point (word boundary)
    let truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      truncated = truncated.slice(0, lastSpace);
    }
    text = truncated.trim() + '…';
  }

  return text;
}

/**
 * Format description for card preview (short, single line)
 */
export function formatDescriptionPreview(
  description: string | null | undefined,
  maxLength: number = 150
): string | null {
  return formatDescription(description, {
    maxLength,
    preserveParagraphs: false,
    emptyText: null,
  });
}

/**
 * Format description for full display (paragraphs preserved)
 */
export function formatDescriptionFull(
  description: string | null | undefined
): string | null {
  return formatDescription(description, {
    preserveParagraphs: true,
    emptyText: null,
  });
}
