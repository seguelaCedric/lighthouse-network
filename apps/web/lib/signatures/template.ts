export interface SignatureSettings {
  logo_url?: string | null;
  logo_width?: number | null;
}

export interface SignatureMember {
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  email?: string | null;
  phone_number?: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
}

function escapeHtml(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildName(member: SignatureMember) {
  const first = member.first_name?.trim() || "";
  const last = member.last_name?.trim() || "";
  return `${first} ${last}`.trim();
}

function renderIconSvg(type: "linkedin" | "facebook") {
  const stroke = "#C3A578";
  if (type === "linkedin") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`;
}

export function buildSignatureHtml(member: SignatureMember, settings: SignatureSettings) {
  const name = escapeHtml(buildName(member));
  const role = escapeHtml(member.role || "");
  const email = escapeHtml(member.email || "");
  const phone = escapeHtml(member.phone_number || "");
  const logoUrl = settings.logo_url || "";
  const logoWidth = settings.logo_width || 140;

  const socialLinks = [
    member.linkedin_url
      ? `<a href="${escapeHtml(member.linkedin_url)}" style="text-decoration:none; display:inline-block; margin-right:8px; border:1px solid #E7D9C0; border-radius:999px; padding:4px;">${renderIconSvg("linkedin")}</a>`
      : "",
    member.facebook_url
      ? `<a href="${escapeHtml(member.facebook_url)}" style="text-decoration:none; display:inline-block; border:1px solid #E7D9C0; border-radius:999px; padding:4px;">${renderIconSvg("facebook")}</a>`
      : "",
  ].join("");

  return `<!-- Lighthouse Careers Email Signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.4;">
  <tr>
    <td style="padding-right: 16px; vertical-align: top;">
      ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" width="${logoWidth}" style="max-width:${logoWidth}px; height:auto; display:block;" alt="Lighthouse Careers"/>` : ""}
    </td>
    <td style="vertical-align: top;">
      <div style="font-size: 14px; font-weight: 700; color: #111827;">${name}</div>
      <div style="font-size: 13px; color: #C3A578;">${role}</div>
      <div style="margin-top: 8px; font-size: 13px;">
        ${email ? `<div><a href="mailto:${escapeHtml(member.email)}" style="color:#1f2937; text-decoration:none;">${email}</a></div>` : ""}
        ${phone ? `<div><a href="tel:${escapeHtml(member.phone_number)}" style="color:#1f2937; text-decoration:none;">${phone}</a></div>` : ""}
      </div>
      ${socialLinks ? `<div style="margin-top: 10px; display:flex; align-items:center;">${socialLinks}</div>` : ""}
    </td>
  </tr>
</table>`;
}

export function buildSignatureText(member: SignatureMember, companyName = "Lighthouse Careers") {
  const name = buildName(member);
  const lines = [name, member.role, member.email, member.phone_number, companyName]
    .filter(Boolean)
    .map((value) => String(value));

  return lines.join("\n");
}
