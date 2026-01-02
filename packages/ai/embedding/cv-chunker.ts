/**
 * CV Text Chunking Algorithm
 *
 * Splits CV text into overlapping chunks for granular semantic search.
 * Each chunk is sized for optimal embedding quality (~800 words) with
 * 200-300 character overlap to preserve context across boundaries.
 *
 * The chunker is section-aware and attempts to:
 * 1. Identify CV sections (Summary, Experience, Skills, Education)
 * 2. Split at natural boundaries (paragraphs, sentences)
 * 3. Assign weights to prioritize important sections
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CVChunk {
  text: string;
  startOffset: number;
  endOffset: number;
  sectionType: CVSectionType;
  sectionWeight: number;
  chunkIndex: number;
}

export type CVSectionType = 'summary' | 'experience' | 'skills' | 'education' | 'certifications' | 'other';

export interface ChunkingOptions {
  /** Maximum characters per chunk (default: 3200 ~800 words) */
  maxChunkSize?: number;
  /** Minimum characters per chunk (default: 400 ~100 words) */
  minChunkSize?: number;
  /** Characters of overlap between chunks (default: 250) */
  overlapSize?: number;
  /** Maximum number of chunks to generate (default: 5) */
  maxChunks?: number;
}

// ============================================================================
// SECTION DETECTION PATTERNS
// ============================================================================

const SECTION_PATTERNS: Record<CVSectionType, RegExp[]> = {
  summary: [
    /(?:^|\n)\s*(?:profile|summary|objective|about\s*(?:me)?|personal\s*(?:statement|profile))/im,
    /(?:^|\n)\s*(?:professional\s*(?:summary|profile))/im,
  ],
  experience: [
    /(?:^|\n)\s*(?:work\s*)?experience/im,
    /(?:^|\n)\s*(?:employment\s*(?:history)?)/im,
    /(?:^|\n)\s*(?:professional\s*experience)/im,
    /(?:^|\n)\s*(?:career\s*(?:history)?)/im,
    /(?:^|\n)\s*(?:yacht(?:ing)?\s*(?:experience)?)/im,
  ],
  skills: [
    /(?:^|\n)\s*(?:skills?|competenc(?:y|ies)|expertise)/im,
    /(?:^|\n)\s*(?:technical\s*skills?)/im,
    /(?:^|\n)\s*(?:key\s*skills?)/im,
    /(?:^|\n)\s*(?:core\s*competenc(?:y|ies))/im,
  ],
  education: [
    /(?:^|\n)\s*(?:education|qualifications?|training)/im,
    /(?:^|\n)\s*(?:academic\s*(?:background)?)/im,
  ],
  certifications: [
    /(?:^|\n)\s*(?:certific(?:ation|ate)s?)/im,
    /(?:^|\n)\s*(?:licen[cs]es?)/im,
    /(?:^|\n)\s*(?:sea\s*service)/im,
    /(?:^|\n)\s*(?:stcw|eng1)/im,
  ],
  other: [],
};

const SECTION_WEIGHTS: Record<CVSectionType, number> = {
  summary: 1.3, // Highest priority - most relevant for matching
  experience: 1.2, // High priority - work history critical
  skills: 1.1, // Medium-high - explicit skills
  certifications: 1.1, // Important for yacht industry
  education: 1.0, // Standard
  other: 0.9, // Lower priority
};

// ============================================================================
// MAIN CHUNKING FUNCTION
// ============================================================================

/**
 * Split CV text into chunks suitable for embedding
 *
 * @param text - Full CV text
 * @param options - Chunking configuration
 * @returns Array of CV chunks with metadata
 */
export function chunkCVText(text: string, options: ChunkingOptions = {}): CVChunk[] {
  const {
    maxChunkSize = 3200,
    minChunkSize = 400,
    overlapSize = 250,
    maxChunks = 5,
  } = options;

  // Clean and normalize text
  const cleanedText = normalizeText(text);

  // If text is short enough, return single chunk
  if (cleanedText.length <= maxChunkSize) {
    const sectionType = detectPrimarySection(cleanedText);
    return [
      {
        text: cleanedText,
        startOffset: 0,
        endOffset: cleanedText.length,
        sectionType,
        sectionWeight: SECTION_WEIGHTS[sectionType],
        chunkIndex: 0,
      },
    ];
  }

  // Detect sections in the text
  const sections = detectSections(cleanedText);

  // Generate chunks from sections
  const chunks = generateChunksFromSections(sections, {
    maxChunkSize,
    minChunkSize,
    overlapSize,
    maxChunks,
  });

  return chunks;
}

// ============================================================================
// TEXT NORMALIZATION
// ============================================================================

/**
 * Clean and normalize CV text for consistent processing
 */
function normalizeText(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace
      .replace(/[ \t]+/g, ' ')
      // Normalize multiple newlines to max 2
      .replace(/\n{3,}/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim()
  );
}

// ============================================================================
// SECTION DETECTION
// ============================================================================

interface DetectedSection {
  type: CVSectionType;
  startOffset: number;
  endOffset: number;
  text: string;
  weight: number;
}

/**
 * Detect sections within CV text
 */
function detectSections(text: string): DetectedSection[] {
  const sections: Array<{ type: CVSectionType; offset: number }> = [];

  // Find all section headers
  for (const [sectionType, patterns] of Object.entries(SECTION_PATTERNS)) {
    if (sectionType === 'other') continue;

    for (const pattern of patterns) {
      const matches = text.matchAll(new RegExp(pattern, 'gi'));
      for (const match of matches) {
        if (match.index !== undefined) {
          sections.push({
            type: sectionType as CVSectionType,
            offset: match.index,
          });
        }
      }
    }
  }

  // Sort by offset
  sections.sort((a, b) => a.offset - b.offset);

  // Remove duplicates (keep first of overlapping sections)
  const uniqueSections = sections.filter((section, i) => {
    if (i === 0) return true;
    // If sections are within 50 chars of each other, keep only first
    return section.offset - sections[i - 1].offset > 50;
  });

  // Convert to sections with text
  const result: DetectedSection[] = [];

  // If text starts before first section, mark as 'other' or 'summary'
  if (uniqueSections.length === 0 || uniqueSections[0].offset > 100) {
    const endOffset = uniqueSections[0]?.offset || text.length;
    const sectionText = text.slice(0, endOffset).trim();
    if (sectionText.length > 50) {
      const type = detectPrimarySection(sectionText);
      result.push({
        type,
        startOffset: 0,
        endOffset,
        text: sectionText,
        weight: SECTION_WEIGHTS[type],
      });
    }
  }

  // Process detected sections
  for (let i = 0; i < uniqueSections.length; i++) {
    const current = uniqueSections[i];
    const next = uniqueSections[i + 1];
    const endOffset = next?.offset || text.length;
    const sectionText = text.slice(current.offset, endOffset).trim();

    if (sectionText.length > 50) {
      result.push({
        type: current.type,
        startOffset: current.offset,
        endOffset,
        text: sectionText,
        weight: SECTION_WEIGHTS[current.type],
      });
    }
  }

  // If no sections detected, return entire text as single section
  if (result.length === 0) {
    const type = detectPrimarySection(text);
    return [
      {
        type,
        startOffset: 0,
        endOffset: text.length,
        text: text,
        weight: SECTION_WEIGHTS[type],
      },
    ];
  }

  return result;
}

/**
 * Detect the primary section type of a text block
 */
function detectPrimarySection(text: string): CVSectionType {
  const lowerText = text.toLowerCase().slice(0, 500);

  // Check for yacht/experience keywords
  if (/yacht|captain|steward|engineer|bosun|deckhand|chief|mate/.test(lowerText)) {
    return 'experience';
  }

  // Check for summary indicators
  if (/professional|experienced|dedicated|seeking|with\s+\d+\s+years/.test(lowerText)) {
    return 'summary';
  }

  // Check for skills indicators
  if (/skills?:|proficient|knowledge of|expertise in/.test(lowerText)) {
    return 'skills';
  }

  return 'other';
}

// ============================================================================
// CHUNK GENERATION
// ============================================================================

/**
 * Generate chunks from detected sections
 */
function generateChunksFromSections(
  sections: DetectedSection[],
  options: Required<ChunkingOptions>
): CVChunk[] {
  const { maxChunkSize, minChunkSize, overlapSize, maxChunks } = options;
  const chunks: CVChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionChunks = splitSectionIntoChunks(
      section.text,
      section.startOffset,
      section.type,
      section.weight,
      { maxChunkSize, minChunkSize, overlapSize }
    );

    for (const chunk of sectionChunks) {
      if (chunks.length >= maxChunks) break;
      chunks.push({ ...chunk, chunkIndex: chunkIndex++ });
    }

    if (chunks.length >= maxChunks) break;
  }

  // If we have too few chunks and text is substantial, ensure we cover the text
  if (chunks.length < 2 && sections.length > 0) {
    const totalText = sections.map(s => s.text).join('\n\n');
    if (totalText.length > maxChunkSize * 1.5) {
      return generateOverlappingChunks(totalText, {
        maxChunkSize,
        minChunkSize,
        overlapSize,
        maxChunks,
      });
    }
  }

  return chunks;
}

/**
 * Split a single section into chunks at natural boundaries
 */
function splitSectionIntoChunks(
  text: string,
  baseOffset: number,
  sectionType: CVSectionType,
  weight: number,
  options: { maxChunkSize: number; minChunkSize: number; overlapSize: number }
): Omit<CVChunk, 'chunkIndex'>[] {
  const { maxChunkSize, minChunkSize, overlapSize } = options;
  const chunks: Omit<CVChunk, 'chunkIndex'>[] = [];

  if (text.length <= maxChunkSize) {
    return [
      {
        text: text.trim(),
        startOffset: baseOffset,
        endOffset: baseOffset + text.length,
        sectionType,
        sectionWeight: weight,
      },
    ];
  }

  // Find split points (paragraph breaks, then sentence breaks)
  const paragraphBreaks = findParagraphBreaks(text);
  let currentStart = 0;

  while (currentStart < text.length) {
    let chunkEnd = Math.min(currentStart + maxChunkSize, text.length);

    // If not at end, find a good break point
    if (chunkEnd < text.length) {
      // Prefer paragraph break
      const nearestParagraph = findNearestBreak(
        paragraphBreaks,
        currentStart + minChunkSize,
        chunkEnd
      );

      if (nearestParagraph !== -1) {
        chunkEnd = nearestParagraph;
      } else {
        // Fall back to sentence break
        const sentenceBreak = findSentenceBreak(
          text,
          currentStart + minChunkSize,
          chunkEnd
        );
        if (sentenceBreak !== -1) {
          chunkEnd = sentenceBreak;
        }
      }
    }

    const chunkText = text.slice(currentStart, chunkEnd).trim();
    if (chunkText.length >= minChunkSize / 2) {
      chunks.push({
        text: chunkText,
        startOffset: baseOffset + currentStart,
        endOffset: baseOffset + chunkEnd,
        sectionType,
        sectionWeight: weight,
      });
    }

    // Move start with overlap
    currentStart = Math.max(currentStart + 1, chunkEnd - overlapSize);

    // Prevent infinite loop
    if (chunkEnd === currentStart) {
      currentStart = chunkEnd;
    }
  }

  return chunks;
}

/**
 * Generate overlapping chunks for text without clear sections
 */
function generateOverlappingChunks(
  text: string,
  options: Required<ChunkingOptions>
): CVChunk[] {
  const { maxChunkSize, overlapSize, maxChunks } = options;
  const chunks: CVChunk[] = [];
  let currentStart = 0;
  let chunkIndex = 0;

  while (currentStart < text.length && chunks.length < maxChunks) {
    const chunkEnd = Math.min(currentStart + maxChunkSize, text.length);
    const chunkText = text.slice(currentStart, chunkEnd).trim();

    if (chunkText.length > 100) {
      const sectionType = detectPrimarySection(chunkText);
      chunks.push({
        text: chunkText,
        startOffset: currentStart,
        endOffset: chunkEnd,
        sectionType,
        sectionWeight: SECTION_WEIGHTS[sectionType],
        chunkIndex: chunkIndex++,
      });
    }

    currentStart = chunkEnd - overlapSize;
    if (currentStart >= text.length - 100) break;
  }

  return chunks;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find all paragraph break positions in text
 */
function findParagraphBreaks(text: string): number[] {
  const breaks: number[] = [];
  let index = 0;

  while ((index = text.indexOf('\n\n', index)) !== -1) {
    breaks.push(index + 2);
    index += 2;
  }

  return breaks;
}

/**
 * Find nearest break point within range
 */
function findNearestBreak(breaks: number[], minPos: number, maxPos: number): number {
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (breaks[i] >= minPos && breaks[i] <= maxPos) {
      return breaks[i];
    }
  }
  return -1;
}

/**
 * Find a sentence break within range
 */
function findSentenceBreak(text: string, minPos: number, maxPos: number): number {
  // Look for sentence endings (. ! ?) followed by space or newline
  const searchText = text.slice(minPos, maxPos);
  const sentenceEnd = /[.!?]\s+(?=[A-Z])/g;

  let lastMatch = -1;
  let match;

  while ((match = sentenceEnd.exec(searchText)) !== null) {
    lastMatch = minPos + match.index + match[0].length;
  }

  return lastMatch;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Estimate the number of chunks that will be generated
 */
export function estimateChunkCount(textLength: number, options: ChunkingOptions = {}): number {
  const { maxChunkSize = 3200, overlapSize = 250, maxChunks = 5 } = options;

  if (textLength <= maxChunkSize) return 1;

  const effectiveChunkSize = maxChunkSize - overlapSize;
  const estimated = Math.ceil(textLength / effectiveChunkSize);

  return Math.min(estimated, maxChunks);
}

/**
 * Get section weights for reference
 */
export function getSectionWeights(): Record<CVSectionType, number> {
  return { ...SECTION_WEIGHTS };
}
