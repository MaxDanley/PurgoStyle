/**
 * Buy Peptides Online keyword list from Google Ads broad-match data.
 * Used for: guide page (PAA-style blocks), blog/PSEO integration.
 * Compliance: Reta-trutide / GLP-3 RT and GLP-2 TRZ (never full spellings in content).
 */

export interface KeywordBlock {
  keyword: string;
  question: string;
  answer: string;
  volume?: number;
  difficulty?: number | null;
}

/** Sanitize for compliance: no full "retatrutide" or "tirzepatide" in content */
export function complianceText(text: string): string {
  return text
    .replace(/\bretatrutide\b/gi, "Reta-trutide (GLP-3 RT)")
    .replace(/\btirzepatide\b/gi, "GLP-2 TRZ")
    .replace(/\btrizepitide\b/gi, "GLP-2 TRZ");
}

/** Heading-safe: use product names for compliance in H2s */
export function complianceHeading(keyword: string): string {
  return complianceText(keyword);
}

const BASE_ANSWER = "You can buy research peptides online from Purgo Labs. We offer premium, lab-tested peptides with Certificates of Analysis (COA), fast US shipping, and multiple payment options including credit card and Zelle. All products are for research use only.";

const SNIPPETS: Record<string, string> = {
  "buy peptides online": "Yes. You can buy peptides online from Purgo Labs. We offer lab-tested research peptides with 99%+ purity verified by HPLC and mass spectrometry, Certificates of Analysis, and fast US shipping. All products are for in vitro research use only.",
  "best place to buy peptides online": "Purgo Labs is a trusted place to buy research peptides online. We provide third-party tested peptides, COAs, US shipping, and support for researchers. Browse our catalog for BPC-157, GLP-2 TRZ, GLP-3 RT (Reta-trutide), IGF-1 LR3, Tesamorelin, and more.",
  "best place to buy peptides online in usa": "Purgo Labs ships research peptides within the USA. We are a US-based supplier of lab-tested peptides with Certificates of Analysis, multiple payment options, and fast domestic shipping. For research use only.",
  "peptides buy online": "You can buy research peptides online at Purgo Labs. We stock premium peptides for laboratory use, with COAs, bulk discounts on select products, and secure checkout. Research use only.",
  "best places to buy peptides online": "Purgo Labs is among the best places to buy research peptides online. We offer HPLC-verified purity, COAs, US shipping, and peptides including BPC-157, GLP-2 TRZ, GLP-3 RT, and others for research.",
  "where to buy peptides online": "You can buy research peptides online at Purgo Labs. We ship throughout the USA and offer lab-tested peptides with Certificates of Analysis, multiple payment methods, and research-only use.",
  "buying peptides online": "Buying peptides online is straightforward at Purgo Labs: choose your product, add to cart, and checkout with credit card, Zelle, or other options. All peptides are for research use and ship with COAs.",
  "buy online peptides": "You can buy peptides online from Purgo Labs. We provide research-grade peptides with verified purity, COAs, and US shipping. For research use only.",
  "retatrutide peptide buy online": "You can buy GLP-3 RT (Reta-trutide) research peptide online from Purgo Labs. We offer lab-tested GLP-3 RT with COA, bulk pricing for 10+ vials, and fast US shipping. For research use only.",
  "buy peptides online usa": "Purgo Labs sells research peptides online and ships within the USA. We offer lab-tested peptides, COAs, and multiple payment options. Research use only.",
  "are peptides legal to buy online": "Research peptides may be purchased online for lawful laboratory and research use. Purgo Labs sells peptides solely for in vitro or ex vivo research and does not sell for human or veterinary use. Compliance with your institution and local laws is the researcher's responsibility.",
  "buy peptide online": "You can buy research peptide online from Purgo Labs. We offer single peptides and multi-vial options with COAs and US shipping. For research use only.",
  "buy research peptides online": "Yes. Purgo Labs sells research peptides online. We provide lab-tested peptides with Certificates of Analysis, fast US shipping, and support for researchers. Research use only.",
  "can you buy peptides online": "Yes. Researchers can buy peptides online from suppliers like Purgo Labs for lawful research. We offer lab-tested peptides with COAs and ship within the USA. For research use only.",
  "buy bpc-157 peptide online": "You can buy BPC-157 peptide online from Purgo Labs. We offer research-grade BPC-157 with Certificate of Analysis and US shipping. For research use only.",
  "buy retatrutide peptide online": "You can buy GLP-3 RT (Reta-trutide) peptide online from Purgo Labs. We offer lab-tested GLP-3 RT with COA and bulk discounts. For research use only.",
  "buy selank peptide online": "Purgo Labs may offer Selank or other research peptides. Browse our products for lab-tested peptides with COAs and US shipping. For research use only.",
  "buy semax peptide online": "Purgo Labs carries research peptides for laboratory use. Check our catalog for Semax and other peptides with COAs and US shipping. For research use only.",
  "buy tirzepatide peptide online": "You can buy GLP-2 TRZ research peptide online from Purgo Labs. We offer lab-tested GLP-2 TRZ with COA and US shipping. For research use only.",
  "is it legal to buy peptides online": "Research peptides can be purchased online for lawful research. Purgo Labs sells peptides for in vitro or ex vivo research only. Researchers must comply with their institution and local regulations.",
  "peptide buy online": "You can buy research peptide online from Purgo Labs. We offer lab-tested peptides with COAs and US shipping. For research use only.",
  "where can i buy peptides online": "You can buy research peptides online at Purgo Labs. We ship in the USA and offer lab-tested peptides with Certificates of Analysis. For research use only.",
  "how to buy peptides online": "To buy peptides online: choose a research peptide at Purgo Labs, add to cart, enter shipping and payment details, and complete checkout. We accept credit card and Zelle. All products are for research use only.",
  "can i buy peptides online": "Yes. Researchers can buy peptides online from Purgo Labs for lawful research. We offer lab-tested peptides with COAs and US shipping. For research use only.",
  "buy peptides online with credit card": "Yes. Purgo Labs accepts credit and debit cards for peptide orders. Place your order online and follow the payment instructions. For research use only.",
  "is buying peptides online legal": "Purchasing research peptides online for lawful laboratory use is permitted in many jurisdictions. Purgo Labs sells for in vitro or ex vivo research only. Researchers must ensure compliance with local laws and institutional policy.",
  "is it safe to buy peptides online": "Buying from a reputable supplier reduces risk. Purgo Labs provides Certificates of Analysis, third-party testing, and clear research-only labeling. Always use peptides only for lawful research.",
  "can you legally buy peptides online": "Researchers may legally purchase peptides online for lawful research in many regions. Purgo Labs sells for in vitro or ex vivo research only. Compliance with local and institutional rules is the buyer's responsibility.",
  "buy peptides online legal": "Purgo Labs sells research peptides online for lawful research use. We do not sell for human or veterinary use. Researchers must comply with their institution and local laws.",
  "best place to buy research peptides online": "Purgo Labs is a strong option for buying research peptides online. We offer COAs, lab-tested purity, US shipping, and peptides such as BPC-157, GLP-2 TRZ, and GLP-3 RT. For research use only.",
  "what is the best place to buy peptides online": "Purgo Labs is a trusted place to buy research peptides online, with COAs, lab-tested purity, US shipping, and multiple payment options. For research use only.",
  "where is the best place to buy peptides online": "Purgo Labs is a reputable place to buy research peptides online. We offer Certificates of Analysis, US shipping, and research-grade peptides. For research use only.",
  "best peptides to buy online": "High-quality research peptides to buy online include BPC-157, GLP-2 TRZ, GLP-3 RT (Reta-trutide), IGF-1 LR3, and Tesamorelin. Purgo Labs offers these with COAs and US shipping. For research use only.",
  "best site to buy peptides online": "Purgo Labs is a reliable site to buy research peptides online. We provide COAs, lab-tested peptides, and US shipping. For research use only.",
  "best sites to buy peptides online": "Purgo Labs is among the trusted sites to buy research peptides online. We offer Certificates of Analysis, lab-tested purity, and US shipping. For research use only.",
  "buy peptides online reddit": "Researchers often discuss where to buy peptides online. Purgo Labs sells research peptides with COAs and US shipping. For research use only.",
  "buy peptides online tirzepatide": "You can buy GLP-2 TRZ research peptide online from Purgo Labs. We offer lab-tested GLP-2 TRZ with COA and US shipping. For research use only.",
  "buy peptides online uk": "Purgo Labs currently ships research peptides within the USA. For UK researchers, check our shipping policy or contact us for availability. For research use only.",
  "buy peptides online united state": "Purgo Labs sells research peptides online and ships within the United States. We offer COAs, lab-tested peptides, and multiple payment options. For research use only.",
  "buy semaglutide peptide online": "Purgo Labs focuses on research peptides such as GLP-2 TRZ, GLP-3 RT, BPC-157, and others. Check our catalog for current offerings with COAs and US shipping. For research use only.",
  "buying peptides online guide": "Guide to buying peptides online: choose a reputable supplier (e.g. Purgo Labs), verify COAs and testing, confirm research-only use, and ensure compliant shipping. We offer lab-tested peptides and US shipping.",
  "how to buy peptides online safely": "To buy peptides online safely: use a supplier that provides COAs (e.g. Purgo Labs), verify research-only use, and follow storage and handling guidelines. We ship in the USA with insurance.",
  "where to buy peptides online usa": "You can buy research peptides online in the USA from Purgo Labs. We ship domestically and offer lab-tested peptides with COAs. For research use only.",
  "where to buy peptides online safely": "Purgo Labs is a place to buy research peptides online with COAs, lab-tested purity, and US shipping. For research use only.",
  "ghk-cu peptide injection buy online": "Purgo Labs offers research peptides for laboratory use. Check our catalog for GHK-Cu and other peptides with COAs and US shipping. For research use only.",
  "mots-c peptide buy online": "Purgo Labs may offer MOTS-c or related research peptides. Browse our products for lab-tested peptides with COAs. For research use only.",
  "bpc 157 peptide buy online": "You can buy BPC-157 peptide online from Purgo Labs. We offer research-grade BPC-157 with COA and US shipping. For research use only.",
  "tesamorelin peptide buy online": "You can buy Tesamorelin research peptide online from Purgo Labs. We offer lab-tested Tesamorelin with COA and US shipping. For research use only.",
  "sermorelin peptide buy online": "Purgo Labs may offer Sermorelin or other research peptides. Check our catalog for lab-tested peptides with COAs. For research use only.",
  "pt 141 peptide buy online": "Purgo Labs carries research peptides for laboratory use. Browse our catalog for PT-141 and other peptides with COAs and US shipping. For research use only.",
  "reta peptide buy online": "You can buy GLP-3 RT (Reta-trutide) research peptide online from Purgo Labs. We offer lab-tested GLP-3 RT with COA and bulk pricing. For research use only.",
  "best place to buy peptides online for weight loss": "Purgo Labs sells research peptides such as GLP-2 TRZ and GLP-3 RT (Reta-trutide) for metabolic research. We do not make weight-loss claims; all products are for research use only.",
  "best place to buy retatrutide peptides online": "You can buy GLP-3 RT (Reta-trutide) research peptide online from Purgo Labs. We offer lab-tested GLP-3 RT with COA, bulk discounts, and US shipping. For research use only.",
  "buy bulk peptides online": "Purgo Labs offers bulk pricing on select research peptides (e.g. 10+ vials). We provide COAs, lab-tested purity, and US shipping. For research use only.",
  "buy ghk cu peptide online": "Purgo Labs may offer GHK-Cu or other research peptides. Check our catalog for lab-tested peptides with COAs and US shipping. For research use only.",
  "buy igf-1 lr3 peptide online": "You can buy IGF-1 LR3 research peptide online from Purgo Labs. We offer lab-tested IGF-1 LR3 with COA and US shipping. For research use only.",
  "buy ipamorelin peptide online": "Purgo Labs may offer Ipamorelin or other research peptides. Browse our products for lab-tested peptides with COAs. For research use only.",
  "buy tb-500 peptide online": "Purgo Labs may offer TB-500 or other research peptides. Check our catalog for lab-tested peptides with COAs and US shipping. For research use only.",
  "where to buy bpc 157 peptide online": "You can buy BPC-157 peptide online from Purgo Labs. We offer research-grade BPC-157 with COA and US shipping. For research use only.",
  "where to buy peptides online for weight loss": "Purgo Labs sells research peptides including GLP-2 TRZ and GLP-3 RT for metabolic research. We do not make weight-loss claims; all products are for research use only.",
  "risks of buying peptides online": "Risks of buying peptides online include counterfeit product or misuse. Purgo Labs mitigates this with COAs, lab testing, and research-only labeling. Always use peptides only for lawful research.",
  "is it illegal to buy peptides online": "Purchasing research peptides online for lawful research is permitted in many jurisdictions. Purgo Labs sells for in vitro or ex vivo research only. Buyers must comply with local and institutional regulations.",
};

/** All keyword blocks for the guide: question = PAA-style, answer = snippet (compliance-safe) */
export function getBuyPeptidesKeywordBlocks(): KeywordBlock[] {
  const raw: Array<{ keyword: string; volume?: number; difficulty?: number | null }> = [
    { keyword: "buy peptides online", volume: 1900, difficulty: 51 },
    { keyword: "best place to buy peptides online", volume: 1300, difficulty: 30 },
    { keyword: "best place to buy peptides online in usa", volume: 480, difficulty: 45 },
    { keyword: "peptides buy online", volume: 390, difficulty: 48 },
    { keyword: "best places to buy peptides online", volume: 320, difficulty: 43 },
    { keyword: "where to buy peptides online", volume: 320, difficulty: 60 },
    { keyword: "buying peptides online", volume: 210, difficulty: 51 },
    { keyword: "buy online peptides", volume: 140, difficulty: 43 },
    { keyword: "retatrutide peptide buy online", volume: 140, difficulty: 6 },
    { keyword: "buy peptides online usa", volume: 90, difficulty: 56 },
    { keyword: "are peptides legal to buy online", volume: 70, difficulty: 11 },
    { keyword: "buy peptide online", volume: 70, difficulty: 46 },
    { keyword: "buy research peptides online", volume: 70, difficulty: 41 },
    { keyword: "ghk-cu peptide injection buy online", volume: 70 },
    { keyword: "can you buy peptides online", volume: 50, difficulty: 57 },
    { keyword: "mots-c peptide buy online", volume: 50 },
    { keyword: "best place to buy peptides online reddit", volume: 40, difficulty: 37 },
    { keyword: "buy bpc-157 peptide online", volume: 40, difficulty: 22 },
    { keyword: "buy retatrutide peptide online", volume: 40, difficulty: 10 },
    { keyword: "buy selank peptide online", volume: 40, difficulty: 13 },
    { keyword: "buy semax peptide online", volume: 40, difficulty: 23 },
    { keyword: "buy tirzepatide peptide online", volume: 40, difficulty: 7 },
    { keyword: "is it legal to buy peptides online", volume: 40 },
    { keyword: "peptide buy online", volume: 40, difficulty: 59 },
    { keyword: "where can i buy peptides online", volume: 40 },
    { keyword: "best place to buy research peptides online", volume: 30 },
    { keyword: "bpc 157 peptide buy online", volume: 30, difficulty: 17 },
    { keyword: "buy peptides online legal", volume: 30 },
    { keyword: "buy peptides online with credit card", volume: 30 },
    { keyword: "can i buy peptides online", volume: 30 },
    { keyword: "how to buy peptides online", volume: 30 },
    { keyword: "is buying peptides online legal", volume: 30 },
    { keyword: "retatrutide peptide buy online usa", volume: 30 },
    { keyword: "tirzepatide peptide buy online", volume: 30 },
    { keyword: "where to buy peptides online reddit", volume: 30 },
    { keyword: "best place to buy peptides online for weight loss", volume: 20 },
    { keyword: "bpc-157 peptide buy online", volume: 20 },
    { keyword: "buy peptides online reddit", volume: 20 },
    { keyword: "buy peptides online tirzepatide", volume: 20 },
    { keyword: "buy peptides online uk", volume: 20 },
    { keyword: "buy peptides online united state", volume: 20 },
    { keyword: "buy semaglutide peptide online", volume: 20 },
    { keyword: "buying peptides online guide", volume: 20 },
    { keyword: "can you legally buy peptides online", volume: 20 },
    { keyword: "is it safe to buy peptides online", volume: 20 },
    { keyword: "tesamorelin peptide buy online", volume: 20 },
    { keyword: "what is the best place to buy peptides online", volume: 20 },
    { keyword: "best peptides to buy online", volume: 10 },
    { keyword: "best place to buy retatrutide peptides online", volume: 10 },
    { keyword: "best site to buy peptides online", volume: 10 },
    { keyword: "best sites to buy peptides online", volume: 10 },
    { keyword: "buy bulk peptides online", volume: 10 },
    { keyword: "buy ghk cu peptide online", volume: 10 },
    { keyword: "buy peptides online safe", volume: 0 },
    { keyword: "where to buy peptides online usa", volume: 0 },
    { keyword: "where to buy peptides online safely", volume: 0 },
    { keyword: "how to buy peptides online safely", volume: 0 },
    { keyword: "where is the best place to buy peptides online", volume: 0 },
    { keyword: "sermorelin peptide buy online", volume: 0 },
    { keyword: "pt 141 peptide buy online", volume: 0 },
    { keyword: "reta peptide buy online", volume: 0 },
    { keyword: "risks of buying peptides online", volume: 0 },
    { keyword: "is it illegal to buy peptides online", volume: 0 },
    { keyword: "where to buy bpc 157 peptide online", volume: 0 },
    { keyword: "where to buy peptides online for weight loss", volume: 0 },
    { keyword: "buy igf-1 lr3 peptide online", volume: 0 },
    { keyword: "buy ipamorelin peptide online", volume: 0 },
    { keyword: "buy tb-500 peptide online", volume: 0 },
  ];

  return raw.map(({ keyword, volume, difficulty }) => {
    const normalized = keyword.toLowerCase().trim();
    const heading = complianceHeading(keyword);
    const question = normalized.endsWith("?") ? heading : (heading.endsWith("?") ? heading : `${heading}?`);
    const answer = complianceText(SNIPPETS[normalized] || BASE_ANSWER);
    return { keyword: heading, question, answer, volume, difficulty };
  });
}

/** Keywords as plain strings for use in blog/PSEO (compliance-safe phrases weaved in) */
export function getBuyPeptidesKeywordPhrases(): string[] {
  const blocks = getBuyPeptidesKeywordBlocks();
  const phrases = new Set<string>();
  blocks.forEach((b) => {
    phrases.add(complianceText(b.keyword));
    phrases.add("buy peptides online");
    phrases.add("buy research peptides online");
    phrases.add("best place to buy peptides online");
    phrases.add("where to buy peptides online");
  });
  return Array.from(phrases);
}
