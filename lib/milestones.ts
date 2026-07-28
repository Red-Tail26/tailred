export type MilestoneStats = {
  soldCount: number;
  totalProfit: number;
  legitDone: number;
  legitTotal: number;
};

export type Milestone = {
  key: string;
  // Checked in array order; the first one that's both true and not
  // dismissed is the one shown. Keep more advanced milestones later so
  // they naturally take priority over earlier ones when both are true.
  condition: (stats: MilestoneStats) => boolean;
  title: string;
  message: string;
  // Only add an offer when it's genuinely relevant to this specific
  // moment — most milestones shouldn't have one. See `reason` for the
  // honest "why," same rule as partner links in the Getting Legit list.
  offer?: { label: string; href: string; reason: string };
};

export const MILESTONES: Milestone[] = [
  {
    key: "first-sale",
    condition: (s) => s.soldCount >= 1,
    title: "First sale — nice work.",
    message:
      "That's the whole loop starting to work: sourced, listed, sold. Keep going.",
  },
  {
    key: "legit-complete",
    condition: (s) => s.legitTotal > 0 && s.legitDone >= s.legitTotal,
    title: "You've checked off the whole Getting Legit list.",
    message:
      "Structure, EIN, bank account, insurance — you're running a real, above-board business now.",
  },
  {
    key: "profit-500",
    condition: (s) => s.totalProfit >= 500,
    title: "You've cleared $500 in profit.",
    message: "This is turning into a real business, not just an experiment.",
    // TODO: replace with a real Biz2Credit affiliate link once approved
    // for their program.
    offer: {
      label: "Biz2Credit",
      href: "https://www.biz2credit.com/",
      reason:
        "worth knowing financing options exist once you're ready to buy more inventory or cover a slow month — it's a credit product, not free money, so only worth a look if it actually fits a real need",
    },
  },
];
