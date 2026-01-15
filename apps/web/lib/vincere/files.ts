/**
 * Vincere Files API
 *
 * Functions for interacting with Vincere candidate files (CVs, photos, etc.).
 */

import { getVincereClient, VincereClient } from './client';

/**
 * Vincere file metadata from API
 *
 * Based on actual Vincere API response schema:
 * - `original_cv: boolean` indicates if this is the candidate's CV
 * - `url` is a temporary download URL (valid 24h)
 * - `file_name` is the filename
 */
export interface VincereFile {
  id: number;
  candidate_id?: number;
  document_type_id?: number;
  external_id?: string;
  file_name?: string;
  original_cv: boolean; // True if this is the candidate's CV
  url?: string; // Temporary download URL (valid 24h)
  uploaded_date?: string;
  compliance_status_id?: number;
  compliance_condition_id?: number;
  expiry_date?: string;
  issued_date?: string;
  // Legacy fields for backwards compatibility with existing code
  name?: string;
  original_file_name?: string;
  content_type?: string;
  size?: number;
}

/**
 * File type constants
 */
export const VINCERE_FILE_TYPES = {
  CV: 'CV',
  PHOTO: 'Photo',
  OTHER: 'Other',
} as const;

export type VincereFileType = typeof VINCERE_FILE_TYPES[keyof typeof VINCERE_FILE_TYPES];

/**
 * Get all files for a candidate
 */
export async function getCandidateFiles(
  vincereId: number,
  client?: VincereClient
): Promise<VincereFile[]> {
  const vincere = client ?? getVincereClient();

  try {
    const files = await vincere.get<VincereFile[]>(`/candidate/${vincereId}/files`);
    return files ?? [];
  } catch (error) {
    // Return empty array if candidate has no files (404)
    if (error instanceof Error && error.message.includes('404')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get candidate's CV file metadata
 */
export async function getCandidateCVFile(
  vincereId: number,
  client?: VincereClient
): Promise<VincereFile | null> {
  const files = await getCandidateFiles(vincereId, client);

  // Find the CV file using original_cv boolean flag
  const cvFile = files.find(f => f.original_cv === true);
  return cvFile ?? null;
}

/**
 * Patterns that indicate an image is NOT an avatar/profile photo
 * These are excluded from avatar selection
 */
const NON_AVATAR_PATTERNS = [
  /tattoo/i,
  /tatt/i,
  /ink/i,
  /body\s*art/i,
  /certificate/i,
  /cert/i,
  /license/i,
  /licence/i,
  /passport/i,
  /visa/i,
  /id[_\-\s]?card/i,
  /document/i,
  /scan/i,
  /screenshot/i,
  /screen\s*shot/i,
  /reference/i,
  /contract/i,
  /medical/i,
  /eng1/i,
  /stcw/i,
  /yacht/i,
  /boat/i,
  /vessel/i,
  /interior/i,
  /galley/i,
  /cabin/i,
];

/**
 * Patterns that indicate an image IS likely an avatar/profile photo
 * These are prioritized for avatar selection
 */
const AVATAR_PATTERNS = [
  /^photo/i,
  /profile/i,
  /avatar/i,
  /headshot/i,
  /head\s*shot/i,
  /portrait/i,
  /face/i,
  /picture/i,
  /pic\./i,
  /img\./i,
];

/**
 * Get candidate's photo file metadata
 *
 * Since Vincere doesn't have a dedicated photo flag like original_cv,
 * we detect photos by file extension and filter out non-avatar images
 * (tattoos, certificates, etc.)
 */
export async function getCandidatePhotoFile(
  vincereId: number,
  client?: VincereClient
): Promise<VincereFile | null> {
  const files = await getCandidateFiles(vincereId, client);

  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

  // Filter to image files that are not CVs
  const imageFiles = files.filter(f => {
    const filename = f.file_name || '';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return photoExtensions.includes(ext) && !f.original_cv;
  });

  if (imageFiles.length === 0) {
    return null;
  }

  // First, try to find a file that matches avatar patterns
  const avatarMatch = imageFiles.find(f => {
    const filename = f.file_name || '';
    return AVATAR_PATTERNS.some(pattern => pattern.test(filename));
  });

  if (avatarMatch) {
    return avatarMatch;
  }

  // Next, filter out files that match non-avatar patterns (tattoos, certs, etc.)
  const filteredFiles = imageFiles.filter(f => {
    const filename = f.file_name || '';
    return !NON_AVATAR_PATTERNS.some(pattern => pattern.test(filename));
  });

  // Return the first filtered file, or null if all were filtered out
  return filteredFiles[0] ?? null;
}

/**
 * Download file content from Vincere
 * Returns the raw file buffer
 *
 * Uses the temporary `url` field from the file metadata (valid 24h)
 * If url is not available, falls back to constructing API endpoint
 */
export async function downloadFile(
  vincereId: number,
  fileId: number,
  client?: VincereClient,
  fileUrl?: string
): Promise<ArrayBuffer> {
  // If we have a direct URL, fetch from it
  if (fileUrl) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  // Fallback to Vincere API endpoint
  const vincere = client ?? getVincereClient();
  const response = await vincere.getRaw(`/candidate/${vincereId}/files/${fileId}/content`);
  return response;
}

/**
 * Download candidate's CV
 * Returns the CV file buffer and metadata
 */
export async function downloadCandidateCV(
  vincereId: number,
  client?: VincereClient
): Promise<{ file: ArrayBuffer; metadata: VincereFile } | null> {
  const cvFile = await getCandidateCVFile(vincereId, client);

  if (!cvFile) {
    return null;
  }

  // Use the temporary URL if available
  const file = await downloadFile(vincereId, cvFile.id, client, cvFile.url);
  return { file, metadata: cvFile };
}

/**
 * Download candidate's photo
 * Returns the photo file buffer and metadata
 */
export async function downloadCandidatePhoto(
  vincereId: number,
  client?: VincereClient
): Promise<{ file: ArrayBuffer; metadata: VincereFile } | null> {
  const photoFile = await getCandidatePhotoFile(vincereId, client);

  if (!photoFile) {
    return null;
  }

  // Use the temporary URL if available
  const file = await downloadFile(vincereId, photoFile.id, client, photoFile.url);
  return { file, metadata: photoFile };
}

/**
 * Get file extension from filename or content type
 */
export function getFileExtension(file: VincereFile): string {
  // Try from file_name (new schema)
  if (file.file_name) {
    const ext = file.file_name.split('.').pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }

  // Try from legacy fields for backwards compatibility
  if (file.original_file_name) {
    const ext = file.original_file_name.split('.').pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }

  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }

  // Fallback to content type
  const contentTypeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };

  if (file.content_type) {
    return contentTypeMap[file.content_type] ?? 'bin';
  }

  return 'bin';
}

/**
 * Check if file is a PDF
 */
export function isPDF(file: VincereFile): boolean {
  if (file.content_type === 'application/pdf') return true;
  const ext = getFileExtension(file);
  return ext === 'pdf';
}

/**
 * Check if file is a Word document
 */
export function isWordDocument(file: VincereFile): boolean {
  if (
    file.content_type === 'application/msword' ||
    file.content_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return true;
  }
  const ext = getFileExtension(file);
  return ext === 'doc' || ext === 'docx';
}

/**
 * Check if file is an image
 */
export function isImage(file: VincereFile): boolean {
  if (file.content_type?.startsWith('image/')) return true;
  const ext = getFileExtension(file);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}

// ============================================================================
// FILE UPLOAD FUNCTIONS
// ============================================================================

/**
 * Vincere document type IDs
 * These map to document types in Vincere's reference data
 */
export const VINCERE_DOCUMENT_TYPES = {
  CV: 3, // CV/Resume - matches n8n workflow
  CERTIFICATE: 1, // Generic certificate
  OTHER: 1, // Other documents
} as const;

/**
 * Upload options for candidate documents
 */
export interface UploadDocumentOptions {
  /** If true, marks as the candidate's original CV */
  isOriginalCV?: boolean;
  /** Document type ID from Vincere reference data */
  documentTypeId?: number;
}

/**
 * Upload response from Vincere
 */
export interface VincereUploadResponse {
  id: number;
  file_name?: string;
  url?: string;
}

/**
 * Upload a document to a candidate in Vincere via URL reference
 *
 * Uses the /file endpoint (singular) with JSON body containing URL.
 * Vincere will fetch the file from the provided URL.
 * This matches the n8n workflow approach.
 *
 * @param vincereId - Candidate's Vincere ID
 * @param documentUrl - Public URL to the document (Vincere will fetch it)
 * @param fileName - Original filename
 * @param options - Upload options (isOriginalCV, documentTypeId)
 * @param client - Optional VincereClient instance
 */
export async function uploadCandidateDocumentByUrl(
  vincereId: number,
  documentUrl: string,
  fileName: string,
  options?: UploadDocumentOptions,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  const vincere = client ?? getVincereClient();

  // Build request body matching n8n workflow format
  // Note: Vincere expects url to be the full HTTPS URL, or they will try to fetch from it
  const body: Record<string, unknown> = {
    file_name: fileName,
    url: documentUrl,
    original_cv: options?.isOriginalCV ? 'true' : 'false',
    document_type_id: options?.documentTypeId ?? VINCERE_DOCUMENT_TYPES.OTHER,
  };

  // Use the /file endpoint (singular) with JSON body - matches n8n workflow
  const result = await vincere.post<VincereUploadResponse>(
    `/candidate/${vincereId}/file`,
    body
  );

  return result;
}

/**
 * Upload a document to a candidate in Vincere via multipart form-data
 *
 * @deprecated Use uploadCandidateDocumentByUrl instead for URL-based uploads
 *
 * @param vincereId - Candidate's Vincere ID
 * @param file - File data as ArrayBuffer or Buffer
 * @param fileName - Original filename
 * @param mimeType - MIME type of the file
 * @param options - Upload options (isOriginalCV, documentTypeId)
 * @param client - Optional VincereClient instance
 */
export async function uploadCandidateDocument(
  vincereId: number,
  file: ArrayBuffer | Buffer,
  fileName: string,
  mimeType: string,
  options?: UploadDocumentOptions,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  const vincere = client ?? getVincereClient();

  // Build additional form fields based on options
  const additionalFields: Record<string, string> = {};

  if (options?.isOriginalCV) {
    additionalFields['original_cv'] = 'true';
  }

  if (options?.documentTypeId) {
    additionalFields['document_type_id'] = options.documentTypeId.toString();
  }

  // Use the multipart upload endpoint
  const result = await vincere.postMultipart<VincereUploadResponse>(
    `/candidate/${vincereId}/files`,
    file,
    fileName,
    mimeType,
    Object.keys(additionalFields).length > 0 ? additionalFields : undefined
  );

  return result;
}

/**
 * Upload a CV to a candidate in Vincere via URL
 * Uses document_type_id: 3 (CV) and original_cv: true
 */
export async function uploadCandidateCVByUrl(
  vincereId: number,
  documentUrl: string,
  fileName: string,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  return uploadCandidateDocumentByUrl(
    vincereId,
    documentUrl,
    fileName,
    { isOriginalCV: true, documentTypeId: VINCERE_DOCUMENT_TYPES.CV },
    client
  );
}

/**
 * Upload a certificate to a candidate in Vincere via URL
 */
export async function uploadCandidateCertificateByUrl(
  vincereId: number,
  documentUrl: string,
  fileName: string,
  documentTypeId?: number,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  return uploadCandidateDocumentByUrl(
    vincereId,
    documentUrl,
    fileName,
    { documentTypeId: documentTypeId ?? VINCERE_DOCUMENT_TYPES.CERTIFICATE },
    client
  );
}

/**
 * @deprecated Use uploadCandidateCVByUrl for URL-based uploads
 * Upload a CV to a candidate in Vincere via file buffer
 * Convenience wrapper that sets isOriginalCV: true
 */
export async function uploadCandidateCV(
  vincereId: number,
  file: ArrayBuffer | Buffer,
  fileName: string,
  mimeType: string,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  return uploadCandidateDocument(vincereId, file, fileName, mimeType, { isOriginalCV: true }, client);
}

/**
 * @deprecated Use uploadCandidateCertificateByUrl for URL-based uploads
 * Upload a certificate/compliance document to a candidate in Vincere
 */
export async function uploadCandidateCertificate(
  vincereId: number,
  file: ArrayBuffer | Buffer,
  fileName: string,
  mimeType: string,
  documentTypeId: number,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  return uploadCandidateDocument(vincereId, file, fileName, mimeType, { documentTypeId }, client);
}

/**
 * Upload a photo to a candidate in Vincere via URL reference
 *
 * Vincere's photo endpoint accepts a URL and file_name, not file upload.
 * Max file size: 800KB (819,200 bytes)
 *
 * @param vincereId - Candidate's Vincere ID
 * @param photoUrl - Public URL to the photo (Vincere will fetch it)
 * @param fileName - Name of the photo file
 * @param client - Optional VincereClient instance
 */
export async function uploadCandidatePhoto(
  vincereId: number,
  photoUrl: string,
  fileName: string,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  const vincere = client ?? getVincereClient();

  // Vincere photo endpoint accepts URL reference, not file data
  const result = await vincere.post<VincereUploadResponse>(
    `/candidate/${vincereId}/photo`,
    { url: photoUrl, file_name: fileName }
  );

  return result;
}

/**
 * @deprecated Use uploadCandidatePhoto with URL instead
 * Legacy function signature for backward compatibility
 */
export async function uploadCandidatePhotoBuffer(
  vincereId: number,
  file: ArrayBuffer | Buffer,
  fileName: string,
  mimeType: string,
  client?: VincereClient
): Promise<VincereUploadResponse> {
  // Photos are uploaded as regular files - Vincere auto-detects based on content type
  return uploadCandidateDocument(vincereId, file, fileName, mimeType, undefined, client);
}
