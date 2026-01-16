// Design System Colors (from design-tokens.ts)
// Gold: #B49A5E (primary brand)
// Navy: #1C2840 (dark navy), #111827 (sidebar bg)
// Gray: warm grays - #7D796F (500), #5C5850 (600), #A8A49B (400)
// Background: #FDFBF7 (cream), #F5F4F1 (gray-100)
// Border: #D4D1CA (gray-300)

// Inline styles for email compatibility (many email clients strip <style> tags)
function inlineStyles(html: string): string {
  return html
    // info-row styling
    .replace(/class="info-row"/g, 'style="padding: 8px 0; border-bottom: 1px solid #E8E6E1;"')
    // info-label styling
    .replace(/class="info-label"/g, 'style="color: #7D796F; font-size: 14px; display: inline-block; min-width: 120px; margin-right: 10px;"')
    // info-value styling
    .replace(/class="info-value"/g, 'style="color: #1C2840; font-size: 14px; font-weight: 500;"')
    // info-box styling
    .replace(/class="info-box"/g, 'style="background-color: #F5F4F1; border-radius: 8px; padding: 20px; margin: 20px 0;"')
    // button styling
    .replace(/class="button"/g, 'style="display: inline-block; padding: 14px 28px; background-color: #B49A5E; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0;"')
    // highlight styling
    .replace(/class="highlight"/g, 'style="color: #B49A5E; font-weight: 600;"')
    // divider styling
    .replace(/class="divider"/g, 'style="height: 1px; background-color: #E8E6E1; margin: 25px 0;"');
}

// Base email template with consistent branding
export function baseTemplate(content: string): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse Careers</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FDFBF7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1C2840;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(26, 24, 22, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #1C2840 0%, #111827 100%);
      padding: 30px;
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background-color: #B49A5E;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-text {
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #F5F4F1;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #E8E6E1;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #7D796F;
    }
    .footer a {
      color: #1C2840;
      text-decoration: none;
    }
    h1 {
      color: #1C2840;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h2 {
      color: #1C2840;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    p {
      color: #433F38;
      font-size: 15px;
      margin-bottom: 15px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #B49A5E;
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #9A7F45;
    }
    .button-secondary {
      background-color: #F5F4F1;
      color: #1C2840;
    }
    .info-box {
      background-color: #F5F4F1;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      padding: 8px 0;
      border-bottom: 1px solid #E8E6E1;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #7D796F;
      font-size: 14px;
      display: inline-block;
      min-width: 120px;
      margin-right: 10px;
    }
    .info-value {
      color: #1C2840;
      font-size: 14px;
      font-weight: 500;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-success {
      background-color: #D1F2E4;
      color: #1D9A6C;
    }
    .badge-warning {
      background-color: #FEF3E2;
      color: #E69A2E;
    }
    .badge-info {
      background-color: #E4E9F0;
      color: #3D4F6F;
    }
    .divider {
      height: 1px;
      background-color: #E8E6E1;
      margin: 25px 0;
    }
    .highlight {
      color: #B49A5E;
      font-weight: 600;
    }
    ul {
      padding-left: 20px;
      margin: 15px 0;
    }
    li {
      margin-bottom: 8px;
      color: #433F38;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div style="padding: 30px; text-align: center;">
        <img src="https://lighthouse-careers.com/logo-email.png" alt="Lighthouse Careers" style="height: 48px; width: auto;" />
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p><strong>Lighthouse Careers</strong></p>
        <p>Your trusted partner in luxury recruitment</p>
        <p style="margin-top: 15px;">
          <a href="https://lighthouse-careers.com">Website</a> ·
          <a href="mailto:hello@lighthouse-careers.com">Contact Us</a>
        </p>
        <p style="margin-top: 15px; font-size: 12px;">
          © ${new Date().getFullYear()} Lighthouse Careers. All rights reserved.
        </p>
        <p style="font-size: 11px; color: #A8A49B;">
          The Lighthouse Careers Team
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return inlineStyles(html);
}

// Generate plain text version from content
export function generatePlainText(content: string): string {
  // Strip HTML tags and convert to plain text
  let text = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `${text}\n\n---\nLighthouse Careers\nYour trusted partner in luxury recruitment\nhttps://lighthouse-careers.com`;
}
