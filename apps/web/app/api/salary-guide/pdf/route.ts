import { NextResponse } from "next/server";

// Static PDF URL - the PDF should be uploaded to public folder as /salary-guide.pdf
const SALARY_GUIDE_PDF_URL = "https://lighthouse-careers.com/salary-guide.pdf";

/**
 * GET /api/salary-guide/pdf
 *
 * Redirects to the static salary guide PDF.
 * The PDF should be manually uploaded to the public folder.
 */
export async function GET() {
  return NextResponse.redirect(SALARY_GUIDE_PDF_URL);
}
