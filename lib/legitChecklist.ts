export type LegitChecklistItem = {
  key: string;
  title: string;
  description: string;
  link?: { label: string; href: string };
  // Affiliate/referral placement — Tailred may earn a commission if
  // someone signs up through this link once a real affiliate ID is in
  // the URL. See the TODO comments below: these currently point at each
  // company's plain homepage (no tracking code), so they earn nothing
  // yet. Once approved for an affiliate program, replace `href` with
  // the real tracking link — no other code changes needed.
  //
  // `reason` is the honest "why we picked this one" — keep it genuine,
  // not sales copy. If a better free/non-partner option ever comes up,
  // recommend that instead; that's what keeps this trustworthy.
  partner?: { label: string; href: string; reason: string };
};

export const LEGIT_CHECKLIST: LegitChecklistItem[] = [
  {
    key: "business-structure",
    title: "Choose a business structure",
    description:
      "Sole proprietorship is the simplest (no paperwork to start), but an LLC separates your personal assets from business risk. Worth deciding early — it affects everything below.",
    link: {
      label: "Compare structures (IRS.gov)",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/business-structures",
    },
    // TODO: replace with a real Northwest Registered Agent affiliate
    // link once approved for their program.
    partner: {
      label: "Northwest Registered Agent",
      href: "https://www.northwestregisteredagent.com/",
      reason:
        "if you go the LLC route, they keep your home address off public filings instead of selling it to marketers, which most registered agents do",
    },
  },
  {
    key: "ein",
    title: "Get a free EIN (federal tax ID)",
    description:
      "A free, instant application directly with the IRS. You'll need this to open a business bank account, even as a sole proprietor.",
    link: {
      label: "Apply for an EIN (IRS.gov)",
      href: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
    },
  },
  {
    key: "business-name",
    title: "Register your business name",
    description:
      "If you're operating under a name other than your own legal name, most states require registering a DBA (\"doing business as\") or fictitious business name — usually through your county clerk or Secretary of State.",
    link: {
      label: "Find your state's process (SBA.gov)",
      href: "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
    },
  },
  {
    key: "bank-account",
    title: "Open a business bank account",
    description:
      "Keeping business money separate from personal makes bookkeeping (and tax time) dramatically easier — and it's what makes your COGS/profit numbers in Tailred actually trustworthy.",
    // TODO: replace with a real Found affiliate link once approved for
    // their program.
    partner: {
      label: "Found",
      href: "https://found.com/",
      reason:
        "built specifically for freelancers and the self-employed, free to open, no minimum balance",
    },
  },
  {
    key: "license-permits",
    title: "Check local business licenses & permits",
    description:
      "Requirements vary a lot by city and county — especially for anything involving food, in-person services, or a physical location. Worth 10 minutes to check before you're surprised later.",
    link: {
      label: "Look up requirements (SBA.gov)",
      href: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits",
    },
  },
  {
    key: "sales-tax",
    title: "Register for a seller's permit (if selling physical goods)",
    description:
      "Resellers and product sellers usually need to collect and remit sales tax. Check your state's Department of Revenue — this one's easy to miss and expensive to fix later.",
  },
  {
    key: "insurance",
    title: "Consider business insurance",
    description:
      "Optional, but worth a look especially for service businesses (power washing, detailing, moving, cleaning) where something could go wrong on someone else's property.",
    // TODO: replace with a real ERGO NEXT Insurance affiliate link once
    // approved for their program.
    partner: {
      label: "ERGO NEXT Insurance",
      href: "https://www.nextinsurance.com/",
      reason: "you can get a quote and a policy online without talking to an agent first",
    },
  },
  {
    key: "separate-records",
    title: "Keep business & personal finances separate",
    description:
      "Once your bank account and EIN are set up, run everything — inventory costs, invoice payments — through the business side. Your Tailred numbers are only as good as this discipline.",
  },
];
