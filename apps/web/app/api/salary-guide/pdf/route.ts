import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "salary-guides";
const PDF_FILENAME = "lighthouse-2026-salary-guide.pdf";

/**
 * Get or create Supabase service client
 */
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Generate PDF from salary guide page and upload to Supabase Storage
 * 
 * This endpoint:
 * 1. Generates a PDF version of the salary guide using Puppeteer
 * 2. Uploads it to Supabase Storage in a public bucket
 * 3. Returns the public URL (or existing URL if already generated)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3004");

    const salaryGuideUrl = `${baseUrl}/salary-guide`;

    // Check if PDF already exists in storage
    const { data: existingFile } = await supabase.storage
      .from(BUCKET_NAME)
      .list(undefined, {
        limit: 1,
        search: PDF_FILENAME,
      });

    if (existingFile && existingFile.length > 0) {
      // PDF already exists, return public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(PDF_FILENAME);

      return NextResponse.json({
        url: publicUrl,
        cached: true,
      });
    }

    // Generate new PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    let pdfBuffer: Buffer;
    try {
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });
      
      // Navigate to salary guide page (with print parameter for better PDF rendering)
      await page.goto(`${salaryGuideUrl}?print=true`, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for main content to load
      await page.waitForSelector("h1", { timeout: 10000 });
      
      // Wait a bit more for any animations or lazy-loaded content
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF with optimized settings (landscape for better table display)
      pdfBuffer = Buffer.from(await page.pdf({
        format: "A4",
        landscape: true, // Set to landscape mode for better table display
        printBackground: true,
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 9px; padding: 0 15mm; width: 100%; text-align: center; color: #6b7280; font-family: Arial, sans-serif;">
            <span>Lighthouse Careers - 2026 Salary Guide</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 9px; padding: 0 15mm; width: 100%; text-align: center; color: #6b7280; font-family: Arial, sans-serif;">
            <span style="margin-right: 10px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            <span>lighthouse-careers.com</span>
          </div>
        `,
        preferCSSPageSize: false,
      }));
    } finally {
      await browser.close();
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(PDF_FILENAME, pdfBuffer, {
        cacheControl: "3600",
        upsert: true, // Overwrite if exists
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("Error uploading PDF to storage:", uploadError);
      // Fallback: return PDF directly if upload fails
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${PDF_FILENAME}"`,
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(PDF_FILENAME);

    return NextResponse.json({
      url: publicUrl,
      cached: false,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    
    // Fallback: redirect to print-friendly page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3004");
    
    return NextResponse.redirect(`${baseUrl}/salary-guide?print=true`);
  }
}

