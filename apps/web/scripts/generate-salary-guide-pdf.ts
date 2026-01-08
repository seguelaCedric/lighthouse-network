import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Manually load .env.local since tsx doesn't do it automatically
function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Try multiple locations for .env.local
const possiblePaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), "../../.env.local"), // From apps/web to root
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../../../.env.local"),
];

for (const p of possiblePaths) {
  loadEnvFile(p);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nPlease ensure these are set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_NAME = "salary-guides";
const PDF_FILENAME = "lighthouse-2026-salary-guide.pdf";

async function generatePDF() {
  console.log("🚀 Starting PDF generation...\n");

  // Check if PDF already exists and delete it to regenerate
  const { data: existingFiles } = await supabase.storage
    .from(BUCKET_NAME)
    .list(undefined, {
      limit: 1,
      search: PDF_FILENAME,
    });

  if (existingFiles && existingFiles.length > 0) {
    console.log("⚠️  PDF already exists. Deleting to regenerate...");
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([PDF_FILENAME]);
    
    if (deleteError) {
      console.error("❌ Error deleting existing PDF:", deleteError);
      // Continue anyway - upsert will overwrite
    } else {
      console.log("✅ Old PDF deleted.\n");
    }
  }

  const salaryGuideUrl = `${baseUrl}/salary-guide?print=true`;
  console.log(`📄 Generating PDF from: ${salaryGuideUrl}\n`);

  // Launch browser
  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });

  let pdfBuffer: Buffer;
  try {
    const page = await browser.newPage();
    
    // Emulate print media to trigger print styles
    await page.emulateMediaType('print');
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2,
    });
    
    console.log("⏳ Loading page...");
    // Navigate to salary guide page
    await page.goto(salaryGuideUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for main content to load
    await page.waitForSelector("h1", { timeout: 10000 });
    
    // Reload the page to ensure print styles are applied
    console.log("🔄 Reloading page to apply print styles...");
    await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
    await page.waitForSelector("h1", { timeout: 10000 });
    
    // Wait for fonts to load
    console.log("⏳ Waiting for fonts to load...");
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for all images to load
    console.log("⏳ Waiting for images to load...");
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
    
    // Wait for CSS to fully apply
    console.log("⏳ Waiting for styles to apply...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Inject comprehensive print-specific CSS to ensure proper rendering
    // Use both @media print and direct styles to catch all cases
    await page.addStyleTag({
      content: `
        /* Force all h1 elements to be dark - no exceptions */
        h1 {
          color: #1A1816 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Force all white text to be dark */
        .text-white {
          color: #1A1816 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            background: white !important;
            color: #1A1816 !important;
          }
          
          /* Force ALL h1 to be dark - highest priority */
          h1, h1.text-white, section h1, section.bg-white h1 {
            color: #1A1816 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Fix dark backgrounds for print - convert to white */
          .bg-gradient-to-br,
          .bg-navy-900,
          .bg-navy-800,
          .bg-navy-700,
          section.bg-gradient-to-br,
          section.bg-navy-900,
          section.bg-navy-800 {
            background: white !important;
            background-color: white !important;
          }
          
          /* Fix ALL text colors for print - make sure white text becomes dark */
          .text-white,
          h1.text-white,
          h2.text-white,
          h3.text-white,
          p.text-white,
          span.text-white,
          div.text-white {
            color: #1A1816 !important;
          }
          
          .text-gray-300 {
            color: #4B5563 !important;
          }
          
          .text-gray-400 {
            color: #6B7280 !important;
          }
          
          .text-gold-300,
          .text-gold-400 {
            color: #8F7A4A !important;
          }
          
          /* Fix hero section specifically */
          section.bg-gradient-to-br h1,
          section.bg-navy-900 h1,
          section.bg-navy-800 h1,
          section.bg-white h1,
          section:first-of-type h1 {
            color: #1A1816 !important;
          }
          
          section.bg-gradient-to-br p,
          section.bg-navy-900 p,
          section.bg-navy-800 p {
            color: #4B5563 !important;
          }
          
          /* Ensure tables are visible */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          
          th, td {
            border: 1px solid #E5E7EB !important;
            padding: 8px !important;
          }
          
          th {
            background: #F9FAFB !important;
            font-weight: 600 !important;
          }
          
          /* Ensure proper page breaks - keep sections together */
          section {
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Keep section headers with their content */
          section > h2,
          section > h3,
          section > div > h2,
          section > div > h3 {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Keep section intro text with first table */
          section > div > div.text-center {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Keep each table component together */
          section > div > div.space-y-8 > div,
          section > div > div.space-y-8 > * {
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Keep tables with their section headers - target specific salary table containers */
          .rounded-lg,
          .rounded-2xl.border.border-gray-200,
          .rounded-2xl.border.border-gray-200.bg-white,
          div.rounded-2xl:has(table),
          div.rounded-2xl.border:has(table),
          div.overflow-x-auto:has(table) {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-region-break-inside: avoid !important;
          }
          
          /* Keep entire table containers together */
          div:has(table) {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-region-break-inside: avoid !important;
          }
          
          /* Keep table rows together */
          table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Keep table headers visible */
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
          
          /* Keep info boxes and notes with their sections */
          .rounded-lg.bg-blue-50,
          .rounded-2xl.bg-gold-50 {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Fix overflow issues */
          .overflow-x-auto {
            overflow: visible !important;
          }
          
          /* Ensure buttons/links are readable */
          a, button {
            color: #1A1816 !important;
          }
          
          /* Remove any gradients or overlays that might interfere */
          .absolute.inset-0 {
            display: none !important;
          }
        }
      `
    });
    
    // Wait for React to fully render and apply conditional styles
    console.log("⏳ Waiting for React to render print styles...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Force fix any remaining white text issues using JavaScript
    console.log("🔧 Applying final text color fixes...");
    await page.evaluate(() => {
      // Find ALL h1 elements and force dark color with inline styles
      const allH1s = document.querySelectorAll('h1');
      allH1s.forEach(h1 => {
        const h1El = h1 as HTMLElement;
        // Remove any white text classes
        h1El.classList.remove('text-white', 'text-gray-300', 'text-gray-400');
        // Set inline style directly - this will override everything
        h1El.setAttribute('style', 'color: #1A1816 !important;');
        h1El.style.color = '#1A1816';
        h1El.style.setProperty('color', '#1A1816', 'important');
      });
      
      // Fix all paragraphs in hero section
      const heroSection = document.querySelector('section.bg-white, section:first-of-type');
      if (heroSection) {
        const paragraphs = heroSection.querySelectorAll('p');
        paragraphs.forEach(p => {
          const pEl = p as HTMLElement;
          pEl.classList.remove('text-white', 'text-gray-300');
          pEl.setAttribute('style', 'color: #374151 !important;');
          pEl.style.color = '#374151';
          pEl.style.setProperty('color', '#374151', 'important');
        });
      }
      
      // Also fix the badge
      const badge = document.querySelector('.inline-flex.items-center.rounded-full');
      if (badge) {
        const badgeEl = badge as HTMLElement;
        badgeEl.setAttribute('style', 'color: #92400E !important; background-color: #FEF3C7 !important; border-color: #B49A5E !important;');
      }
      
      // Apply page break controls to prevent sections from breaking
      const sections = document.querySelectorAll('section');
      sections.forEach(section => {
        const sectionEl = section as HTMLElement;
        sectionEl.style.setProperty('page-break-inside', 'avoid', 'important');
        sectionEl.style.setProperty('break-inside', 'avoid', 'important');
      });
      
      // Keep table components together
      const tableContainers = document.querySelectorAll('.rounded-lg, section > div > div.space-y-8 > div');
      tableContainers.forEach(container => {
        const containerEl = container as HTMLElement;
        containerEl.style.setProperty('page-break-inside', 'avoid', 'important');
        containerEl.style.setProperty('break-inside', 'avoid', 'important');
      });
      
      // Keep section headers with content
      const sectionHeaders = document.querySelectorAll('section > h2, section > h3, section > div > h2, section > div > h3');
      sectionHeaders.forEach(header => {
        const headerEl = header as HTMLElement;
        headerEl.style.setProperty('page-break-after', 'avoid', 'important');
        headerEl.style.setProperty('break-after', 'avoid', 'important');
      });
      
      // Keep table rows together - CRITICAL
      const tableRows = document.querySelectorAll('table tr');
      tableRows.forEach(row => {
        const rowEl = row as HTMLElement;
        rowEl.style.setProperty('page-break-inside', 'avoid', 'important');
        rowEl.style.setProperty('break-inside', 'avoid', 'important');
        rowEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
      });
      
      // Keep table cells together
      const tableCells = document.querySelectorAll('table td, table th');
      tableCells.forEach(cell => {
        const cellEl = cell as HTMLElement;
        cellEl.style.setProperty('page-break-inside', 'avoid', 'important');
        cellEl.style.setProperty('break-inside', 'avoid', 'important');
      });
      
      // Keep entire tables together - find all table containers
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        const tableEl = table as HTMLElement;
        tableEl.style.setProperty('page-break-inside', 'avoid', 'important');
        tableEl.style.setProperty('break-inside', 'avoid', 'important');
        tableEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
        
        // Also apply to parent container
        const parent = tableEl.parentElement;
        if (parent) {
          parent.style.setProperty('page-break-inside', 'avoid', 'important');
          parent.style.setProperty('break-inside', 'avoid', 'important');
          parent.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
        }
      });
      
      // Find all table wrapper divs and keep them together
      const tableWrappers = document.querySelectorAll('div:has(table), .rounded-lg:has(table)');
      tableWrappers.forEach(wrapper => {
        const wrapperEl = wrapper as HTMLElement;
        wrapperEl.style.setProperty('page-break-inside', 'avoid', 'important');
        wrapperEl.style.setProperty('break-inside', 'avoid', 'important');
        wrapperEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
      });
      
      // Find all divs that contain tables (more aggressive search)
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach(div => {
        const divEl = div as HTMLElement;
        const hasTable = divEl.querySelector('table');
        if (hasTable) {
          divEl.style.setProperty('page-break-inside', 'avoid', 'important');
          divEl.style.setProperty('break-inside', 'avoid', 'important');
          divEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
          
          // Also apply to parent if it's a rounded container
          const parent = divEl.parentElement;
          if (parent && (parent.classList.contains('rounded-2xl') || parent.classList.contains('rounded-lg'))) {
            parent.style.setProperty('page-break-inside', 'avoid', 'important');
            parent.style.setProperty('break-inside', 'avoid', 'important');
            parent.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
          }
        }
      });
      
      // Specifically target rounded-2xl containers (salary table containers)
      const roundedContainers = document.querySelectorAll('.rounded-2xl');
      roundedContainers.forEach(container => {
        const containerEl = container as HTMLElement;
        if (containerEl.querySelector('table')) {
          containerEl.style.setProperty('page-break-inside', 'avoid', 'important');
          containerEl.style.setProperty('break-inside', 'avoid', 'important');
          containerEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
        }
      });
      
      // Target overflow-x-auto divs that contain tables
      const overflowContainers = document.querySelectorAll('.overflow-x-auto');
      overflowContainers.forEach(container => {
        const containerEl = container as HTMLElement;
        if (containerEl.querySelector('table')) {
          containerEl.style.setProperty('page-break-inside', 'avoid', 'important');
          containerEl.style.setProperty('break-inside', 'avoid', 'important');
          containerEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
        }
      });
      
      // Also target the space-y-8 containers that hold multiple tables
      const spaceY8Containers = document.querySelectorAll('.space-y-8');
      spaceY8Containers.forEach(container => {
        const containerEl = container as HTMLElement;
        const children = containerEl.children;
        // Apply to each child that contains a table
        Array.from(children).forEach(child => {
          const childEl = child as HTMLElement;
          if (childEl.querySelector('table')) {
            childEl.style.setProperty('page-break-inside', 'avoid', 'important');
            childEl.style.setProperty('break-inside', 'avoid', 'important');
            childEl.style.setProperty('-webkit-region-break-inside', 'avoid', 'important');
            childEl.style.setProperty('page-break-after', 'auto', 'important');
          }
        });
      });
    });
    
    // Wait for changes to apply
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take a screenshot to verify what Puppeteer sees
    console.log("📸 Taking screenshot to verify rendering...");
    await page.screenshot({ path: 'test-salary-guide-hero.png', fullPage: false });
    
    // Verify the h1 color one more time
    const finalCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1) return null;
      const style = window.getComputedStyle(h1);
      const inlineStyle = (h1 as HTMLElement).style.color;
      return {
        computedColor: style.color,
        inlineStyle: inlineStyle,
        classes: h1.className,
        styleAttr: (h1 as HTMLElement).getAttribute('style'),
      };
    });
    console.log("📊 Final H1 check:", finalCheck);

    console.log("📝 Generating PDF...");
    // Generate PDF with optimized settings
    pdfBuffer = Buffer.from(await page.pdf({
      format: "A4",
      landscape: true, // Set to landscape mode for better table display
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
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
      scale: 1,
    }));

    console.log(`✅ PDF generated! Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);
  } finally {
    await browser.close();
  }

  // Upload to Supabase Storage
  console.log("☁️  Uploading to Supabase Storage...");
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(PDF_FILENAME, pdfBuffer, {
      cacheControl: "3600",
      upsert: true, // Overwrite if exists
      contentType: "application/pdf",
    });

  if (uploadError) {
    console.error("❌ Error uploading PDF to storage:", uploadError);
    process.exit(1);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(PDF_FILENAME);

  console.log("✅ PDF uploaded successfully!\n");
  console.log("📄 Public URL:", publicUrl);
  console.log("\n✨ Done! The PDF is now available for download.");
}

generatePDF().catch((error) => {
  console.error("❌ Error generating PDF:", error);
  process.exit(1);
});

