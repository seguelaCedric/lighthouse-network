// Base email template with consistent branding
export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lighthouse Crew</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a2b4a;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .header {
      background: linear-gradient(135deg, #1a2b4a 0%, #2a3b5a 100%);
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
      background-color: #c9a962;
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
      background-color: #f8f9fa;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #eaeaea;
    }
    .footer p {
      margin: 5px 0;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #1a2b4a;
      text-decoration: none;
    }
    h1 {
      color: #1a2b4a;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    h2 {
      color: #1a2b4a;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    p {
      color: #374151;
      font-size: 15px;
      margin-bottom: 15px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #c9a962;
      color: #1a2b4a;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #b89a52;
    }
    .button-secondary {
      background-color: #f3f4f6;
      color: #1a2b4a;
    }
    .info-box {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eaeaea;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #6b7280;
      font-size: 14px;
    }
    .info-value {
      color: #1a2b4a;
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
      background-color: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    .badge-info {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .divider {
      height: 1px;
      background-color: #eaeaea;
      margin: 25px 0;
    }
    .highlight {
      color: #c9a962;
      font-weight: 600;
    }
    ul {
      padding-left: 20px;
      margin: 15px 0;
    }
    li {
      margin-bottom: 8px;
      color: #374151;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6V12C4 16.41 7.39 20.69 12 22C16.61 20.69 20 16.41 20 12V6L12 2Z" fill="#1a2b4a"/>
            </svg>
          </div>
          <span class="logo-text">Lighthouse Crew</span>
        </div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p><strong>Lighthouse Crew Network</strong></p>
        <p>Your trusted partner in yacht crew recruitment</p>
        <p style="margin-top: 15px;">
          <a href="https://lighthouse.crew">Website</a> ·
          <a href="mailto:hello@lighthouse.crew">Contact Us</a>
        </p>
        <p style="margin-top: 15px; font-size: 12px;">
          © ${new Date().getFullYear()} Lighthouse Crew. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
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

  return `${text}\n\n---\nLighthouse Crew Network\nYour trusted partner in yacht crew recruitment\nhttps://lighthouse.crew`;
}
