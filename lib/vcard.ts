type BusinessCardInfo = {
  business_name: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  social_links: string | null;
};

// RFC 6350: backslash, comma, semicolon, and newline are field
// delimiters and must be escaped or a scanner can mis-parse the card.
function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildVCard(info: BusinessCardInfo): string {
  const name = escapeVCardText(info.business_name || "Tailred Business");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `ORG:${name}`,
  ];

  if (info.phone) lines.push(`TEL;TYPE=WORK:${escapeVCardText(info.phone)}`);
  if (info.address)
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(info.address)};;;;`);
  if (info.website) lines.push(`URL:${escapeVCardText(info.website)}`);
  if (info.social_links)
    lines.push(`NOTE:${escapeVCardText(info.social_links)}`);

  lines.push("END:VCARD");
  return lines.join("\n");
}
