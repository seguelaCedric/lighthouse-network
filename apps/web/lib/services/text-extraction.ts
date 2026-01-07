/**
 * Text Extraction Service
 *
 * Extracts text content from PDFs, Word documents, and other document formats for AI processing.
 * Supports: PDF, DOC, DOCX, plain text
 * Partially supports: .pages (extracts embedded XML if available)
 */

// Use require for CommonJS modules that don't support ESM properly
// Load pdf-parse from its lib entry to avoid the test runner side effects.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

/**
 * Result of text extraction
 */
export interface ExtractionResult {
  text: string;
  pageCount?: number;
  metadata?: Record<string, unknown>;
  error?: string;
  warning?: string;
}

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<ExtractionResult> {
  try {
    // pdf-parse requires a Buffer, not ArrayBuffer
    const nodeBuffer = Buffer.from(buffer);
    const data = await pdfParse(nodeBuffer);

    return {
      text: cleanExtractedText(data.text),
      pageCount: data.numpages,
      metadata: data.info,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error during PDF extraction',
    };
  }
}

/**
 * Extract text from a Word document (.docx)
 * Note: mammoth only supports .docx, not legacy .doc files
 */
export async function extractTextFromWord(buffer: ArrayBuffer): Promise<ExtractionResult> {
  try {
    const nodeBuffer = Buffer.from(buffer);
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });

    if (result.messages.length > 0) {
      console.warn('Word extraction warnings:', result.messages);
    }

    return {
      text: cleanExtractedText(result.value),
    };
  } catch (error) {
    console.error('Word document extraction error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error during Word extraction',
    };
  }
}

/**
 * Attempt to extract text from legacy .doc files
 * This is a best-effort extraction that may not work for all files
 */
export async function extractTextFromLegacyDoc(buffer: ArrayBuffer): Promise<ExtractionResult> {
  // First try mammoth - sometimes it works with .doc
  const mammothResult = await extractTextFromWord(buffer);
  if (mammothResult.text.length > 50) {
    return mammothResult;
  }

  // Fallback: try to extract any readable text from the binary
  // .doc files have embedded text in various places
  try {
    const nodeBuffer = Buffer.from(buffer);
    const binaryString = nodeBuffer.toString('latin1');

    // Try to find readable text sections (this is crude but sometimes works)
    const textMatches = binaryString.match(/[\x20-\x7E\n\r\t]{20,}/g);
    if (textMatches && textMatches.length > 0) {
      // Filter out likely garbage
      const cleanedText = textMatches
        .filter((t) => {
          const wordCount = t.split(/\s+/).length;
          const letterCount = (t.match(/[a-zA-Z]/g) || []).length;
          return wordCount > 3 && letterCount / t.length > 0.5;
        })
        .join('\n\n');

      if (cleanedText.length > 100) {
        return {
          text: cleanExtractedText(cleanedText),
          warning: 'Extracted from legacy .doc format - some content may be missing',
        };
      }
    }
  } catch {
    // Ignore extraction errors
  }

  return {
    text: '',
    error: 'Could not extract text from legacy .doc file. Please convert to .docx or PDF.',
  };
}

/**
 * Attempt to extract text from Apple Pages files
 * .pages files are actually ZIP archives with XML content
 */
export async function extractTextFromPages(buffer: ArrayBuffer): Promise<ExtractionResult> {
  try {
    // Check if this is a ZIP archive (Pages files start with PK)
    const view = new Uint8Array(buffer.slice(0, 2));
    const isZip = view[0] === 0x50 && view[1] === 0x4b;

    if (!isZip) {
      return {
        text: '',
        error: 'Pages file is not in expected format. Please export as PDF or DOCX.',
      };
    }

    // For now, return an error asking for conversion
    // Full implementation would require a ZIP library + XML parsing
    return {
      text: '',
      error: 'Pages files are not fully supported. Please export as PDF or DOCX from Pages.',
    };
  } catch (error) {
    return {
      text: '',
      error: 'Failed to process Pages file. Please export as PDF or DOCX.',
    };
  }
}

/**
 * Extract text from a document based on its content type
 */
export async function extractText(
  buffer: ArrayBuffer,
  contentType: string,
  filename?: string
): Promise<ExtractionResult> {
  const lowerFilename = filename?.toLowerCase() || '';

  // Determine file type from content type or filename
  const isPdf =
    contentType === 'application/pdf' ||
    lowerFilename.endsWith('.pdf');

  const isDocx =
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerFilename.endsWith('.docx');

  const isDoc =
    contentType === 'application/msword' ||
    lowerFilename.endsWith('.doc');

  const isPages =
    contentType === 'application/vnd.apple.pages' ||
    lowerFilename.endsWith('.pages');

  if (isPdf) {
    return extractTextFromPDF(buffer);
  }

  if (isDocx) {
    return extractTextFromWord(buffer);
  }

  if (isDoc) {
    return extractTextFromLegacyDoc(buffer);
  }

  if (isPages) {
    return extractTextFromPages(buffer);
  }

  // Plain text files
  if (contentType.startsWith('text/')) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(buffer);
      return { text: cleanExtractedText(text) };
    } catch {
      return {
        text: '',
        error: 'Failed to decode text file',
      };
    }
  }

  // RTF files
  if (contentType === 'application/rtf' || lowerFilename.endsWith('.rtf')) {
    return {
      text: '',
      error: 'RTF files are not supported. Please convert to PDF or DOCX.',
    };
  }

  return {
    text: '',
    error: `Unsupported file type: ${contentType || lowerFilename}`,
  };
}

/**
 * Clean extracted text for better AI processing
 * - Normalizes whitespace
 * - Removes excessive newlines
 * - Trims empty lines
 */
export function cleanExtractedText(text: string): string {
  return (
    text
      // Replace multiple spaces with single space
      .replace(/ +/g, ' ')
      // Replace multiple newlines with double newline (paragraph break)
      .replace(/\n{3,}/g, '\n\n')
      // Trim lines
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      // Remove leading/trailing whitespace
      .trim()
  );
}

/**
 * Check if content type is extractable
 */
export function isExtractable(contentType: string, filename?: string): boolean {
  const lowerFilename = filename?.toLowerCase() || '';

  const isPdf =
    contentType === 'application/pdf' ||
    lowerFilename.endsWith('.pdf');

  const isDocx =
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerFilename.endsWith('.docx');

  const isDoc =
    contentType === 'application/msword' ||
    lowerFilename.endsWith('.doc');

  const isText = contentType.startsWith('text/');

  return isPdf || isDocx || isDoc || isText;
}

/**
 * Get supported file types for user display
 */
export function getSupportedFileTypes(): string[] {
  return ['PDF', 'DOCX', 'DOC', 'TXT'];
}

/**
 * Get file type for display
 */
export function getFileTypeLabel(contentType: string, filename?: string): string {
  const lowerFilename = filename?.toLowerCase() || '';

  if (contentType === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
    return 'PDF';
  }
  if (
    contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerFilename.endsWith('.docx')
  ) {
    return 'DOCX';
  }
  if (contentType === 'application/msword' || lowerFilename.endsWith('.doc')) {
    return 'DOC';
  }
  if (lowerFilename.endsWith('.pages')) {
    return 'Pages';
  }
  if (contentType.startsWith('text/') || lowerFilename.endsWith('.txt')) {
    return 'Text';
  }
  if (contentType === 'application/rtf' || lowerFilename.endsWith('.rtf')) {
    return 'RTF';
  }

  return 'Unknown';
}

/**
 * Estimate token count for embedding (rough approximation)
 * OpenAI text-embedding-3-small has 8191 token limit
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token limits
 * Preserves start and end of document which typically contain key info
 */
export function truncateForEmbedding(
  text: string,
  maxTokens: number = 8000
): string {
  const estimatedTokens = estimateTokenCount(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Calculate character limits (4 chars per token)
  const maxChars = maxTokens * 4;
  const keepFromStart = Math.floor(maxChars * 0.6); // Keep 60% from start
  const keepFromEnd = Math.floor(maxChars * 0.3); // Keep 30% from end

  const start = text.slice(0, keepFromStart);
  const end = text.slice(-keepFromEnd);

  return `${start}\n\n[...content truncated...]\n\n${end}`;
}
