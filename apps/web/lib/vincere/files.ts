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
 * Get candidate's photo file metadata
 *
 * Since Vincere doesn't have a dedicated photo flag like original_cv,
 * we detect photos by file extension.
 */
export async function getCandidatePhotoFile(
  vincereId: number,
  client?: VincereClient
): Promise<VincereFile | null> {
  const files = await getCandidateFiles(vincereId, client);

  // Find photo by extension
  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const photoFile = files.find(f => {
    const filename = f.file_name || '';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return photoExtensions.includes(ext) && !f.original_cv;
  });
  return photoFile ?? null;
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
