type BusinessCardInfo = {
  business_name: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  social_links: string | null;
};

export function buildVCard(info: BusinessCardInfo): string {
  const name = info.business_name || "Tailred Business";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `ORG:${name}`,
  ];

  if (info.phone) lines.push(`TEL;TYPE=WORK:${info.phone}`);
  if (info.address) lines.push(`ADR;TYPE=WORK:;;${info.address};;;;`);
  if (info.website) lines.push(`URL:${info.website}`);
  if (info.social_links) lines.push(`NOTE:${info.social_links}`);

  lines.push("END:VCARD");
  return lines.join("\n");
}
