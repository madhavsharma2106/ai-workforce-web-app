export type Lead = {
  id: number;
  company: string;
  website: string;
  fit: string;
  decisionMaker: string;
  email: string;
  draft: string;
  sources: string;
  personId?: string;
  emailRevealed?: boolean;
};

export type DayTemplate = {
  leads: Lead[];
  researched: number;
  focus: string;
};

export const dayTemplates: DayTemplate[] = [
  {
    researched: 84,
    focus:
      "B2B SaaS companies with weak video presence that could benefit from case studies or product videos.",
    leads: [
      {
        id: 1,
        company: "Waveflow Media",
        website: "waveflow.media",
        fit: "Video-first SaaS with weak case study storytelling.",
        decisionMaker: "Maya Patel, Head of Growth",
        email: "maya@waveflow.media",
        draft:
          "Hi Maya, I noticed Waveflow has strong product video energy but few customer stories. I'd love to share how a fresh case study series could help you win more video-first buyers.",
        sources: "LinkedIn, company page, product landing page",
      },
      {
        id: 2,
        company: "BrightCove Labs",
        website: "brightcovelabs.com",
        fit: "SaaS team with launch videos but no follow-up campaigns.",
        decisionMaker: "Jordan Lee, Marketing Director",
        email: "jordan@brightcovelabs.com",
        draft:
          "Hi Jordan, I saw your recent launch content and think a personalized case study series could extend that momentum to enterprise buyers.",
        sources: "Crunchbase, newsletter, public case studies",
      },
      {
        id: 3,
        company: "FlowPath AI",
        website: "flowpath.ai",
        fit: "AI product with limited customer storytelling online.",
        decisionMaker: "Avery Chen, Founder",
        email: "avery@flowpath.ai",
        draft:
          "Hi Avery, FlowPath AI has a strong product story. I'd suggest a set of short client videos that highlight real ROI and make outreach feel more human.",
        sources: "Twitter, product page, investor notes",
      },
      {
        id: 4,
        company: "PulseCraft",
        website: "pulsecraft.co",
        fit: "Growth-stage SaaS without a clear video case study path.",
        decisionMaker: "Noah Rivera, VP Sales",
        email: "noah@pulsecraft.co",
        draft:
          "Hi Noah, PulseCraft's audience could really benefit from a video-led case study campaign that turns product proof into pipeline warm leads.",
        sources: "LinkedIn, pricing page, press release",
      },
      {
        id: 5,
        company: "StudioScale",
        website: "studioscale.io",
        fit: "Creative SaaS with product demos but no outreach personalization.",
        decisionMaker: "Sofia Nguyen, Chief Marketing Officer",
        email: "sofia@studioscale.io",
        draft:
          "Hi Sofia, I noticed StudioScale has a compelling demo library. I can help turn that into outreach that feels personal and high-touch.",
        sources: "Instagram, demo page, team bios",
      },
    ],
  },
  {
    researched: 67,
    focus:
      "Mid-market SaaS teams that just shipped a product launch but have gone quiet on customer proof.",
    leads: [
      {
        id: 1,
        company: "Nimbus Ledger",
        website: "nimbusledger.com",
        fit: "Fintech SaaS with a recent launch but no customer proof on site.",
        decisionMaker: "Priya Shah, VP Marketing",
        email: "priya@nimbusledger.com",
        draft:
          "Hi Priya, congrats on the Nimbus Ledger launch — I noticed the site is light on customer proof yet. A quick case study series could help close the trust gap for enterprise buyers.",
        sources: "Product Hunt, LinkedIn, company blog",
      },
      {
        id: 2,
        company: "Fernwood Analytics",
        website: "fernwoodanalytics.com",
        fit: "Data SaaS with strong demo requests but weak follow-through content.",
        decisionMaker: "Diego Ramos, Head of Demand Gen",
        email: "diego@fernwoodanalytics.com",
        draft:
          "Hi Diego, I saw Fernwood's demo request volume is climbing — a short customer story series could help convert more of that interest into pipeline.",
        sources: "G2 reviews, LinkedIn, company page",
      },
      {
        id: 3,
        company: "Cobalt Ops",
        website: "cobaltops.io",
        fit: "DevOps tooling company with technical buyers but no social proof.",
        decisionMaker: "Lena Fischer, Founder",
        email: "lena@cobaltops.io",
        draft:
          "Hi Lena, Cobalt Ops' docs are excellent, but I don't see much customer proof for skeptical technical buyers — happy to share how a lightweight case study could help.",
        sources: "GitHub, Twitter, product page",
      },
      {
        id: 4,
        company: "Harborlight CRM",
        website: "harborlightcrm.com",
        fit: "CRM startup with active hiring page signaling growth stage.",
        decisionMaker: "Owen Baptiste, Director of Marketing",
        email: "owen@harborlightcrm.com",
        draft:
          "Hi Owen, noticed Harborlight is hiring across GTM — that's usually when a case study library starts paying for itself. Worth a quick look?",
        sources: "LinkedIn jobs, company page, press release",
      },
      {
        id: 5,
        company: "Slate & Bloom",
        website: "slateandbloom.com",
        fit: "Vertical SaaS for creative agencies, no video testimonials yet.",
        decisionMaker: "Grace Kim, CMO",
        email: "grace@slateandbloom.com",
        draft:
          "Hi Grace, Slate & Bloom's product tour is great but there's no video testimonial yet — I think that's the missing piece to convert agency buyers faster.",
        sources: "Instagram, product page, team bios",
      },
    ],
  },
  {
    researched: 52,
    focus:
      "Founder-led SaaS teams under 20 people with recent funding news but no outbound motion yet.",
    leads: [
      {
        id: 1,
        company: "Meridian Stack",
        website: "meridianstack.com",
        fit: "Recently funded SaaS with no outbound motion in place.",
        decisionMaker: "Talia Okoro, Co-founder",
        email: "talia@meridianstack.com",
        draft:
          "Hi Talia, congrats on the raise — with a small team, a lightweight case study library can do a lot of outbound's job. Happy to share what that could look like.",
        sources: "Crunchbase, LinkedIn, funding announcement",
      },
      {
        id: 2,
        company: "Ironvine Logistics Software",
        website: "ironvine.io",
        fit: "Logistics SaaS with strong product but no proof-driven outreach.",
        decisionMaker: "Marcus Webb, Head of Sales",
        email: "marcus@ironvine.io",
        draft:
          "Hi Marcus, Ironvine's product demo is strong, but outreach still leans generic — a couple of sharp case studies could make prospecting land faster.",
        sources: "LinkedIn, company blog, product page",
      },
      {
        id: 3,
        company: "Copperline Health",
        website: "copperlinehealth.com",
        fit: "Healthtech SaaS, founder-led, ideal client but pre-outbound.",
        decisionMaker: "Dr. Elena Voss, Founder",
        email: "elena@copperlinehealth.com",
        draft:
          "Hi Elena, Copperline's clinical results are compelling — turning a couple into short case studies could give your outbound a real edge.",
        sources: "Twitter, funding announcement, product page",
      },
      {
        id: 4,
        company: "Driftwood Analytics",
        website: "driftwoodanalytics.com",
        fit: "Small analytics team, recent seed round, no customer marketing yet.",
        decisionMaker: "Sam Whitfield, Co-founder",
        email: "sam@driftwoodanalytics.com",
        draft:
          "Hi Sam, saw the seed round news — this is usually the moment customer marketing gets deprioritized. Happy to help you stand up a quick case study motion.",
        sources: "Crunchbase, LinkedIn, press release",
      },
      {
        id: 5,
        company: "Larkspur Robotics",
        website: "larkspurrobotics.com",
        fit: "Hardware-adjacent SaaS, strong pilots but no public proof.",
        decisionMaker: "Ibrahim Nasser, VP Growth",
        email: "ibrahim@larkspurrobotics.com",
        draft:
          "Hi Ibrahim, Larkspur's pilot results sound strong internally — worth turning one into a public case study to speed up the next round of deals?",
        sources: "LinkedIn, company page, investor notes",
      },
    ],
  },
];
