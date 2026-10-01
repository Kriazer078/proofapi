export interface AnalysisResult {
  riskScore: number; // 0..100
  issues: string[];
  summary: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  analyze(text: string): Promise<AnalysisResult>;
}

/** English, Russian and Kazakh stems, matching the languages of the interface. */
const RULES: { pattern: RegExp; issue: string; weight: number }[] = [
  { pattern: /terminat|расторж|бұзу/i, issue: "Termination clause", weight: 8 },
  { pattern: /liabilit|ответственн|жауапкершілі/i, issue: "Liability risk", weight: 13 },
  { pattern: /payment|invoice|оплат|платеж|платёж|төлем/i, issue: "Payment condition", weight: 10 },
  { pattern: /penalt|штраф|неустойк|айыппұл/i, issue: "Penalty clause", weight: 12 },
  { pattern: /indemnif|возмещени|өтеу/i, issue: "Indemnification obligation", weight: 15 },
  { pattern: /confidential|конфиденциальн|құпия/i, issue: "Confidentiality obligation", weight: 4 },
  { pattern: /auto(matic)?(ally)?[- ]?renew|автопролонг|автоматическ[а-я]* продлен|автоматты ұзарт/i, issue: "Automatic renewal", weight: 9 },
];

/** Risk categories the interface knows how to name in every language. */
export const KNOWN_ISSUES = RULES.map((rule) => rule.issue);

/** Deterministic keyword-based stand-in for a real model. Real providers plug in behind AIProvider later. */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";
  readonly model = "proofapi-mock-v1";

  async analyze(text: string): Promise<AnalysisResult> {
    const found = RULES.filter((rule) => rule.pattern.test(text));
    const lengthFactor = Math.min(10, Math.floor(text.length / 2000));
    const riskScore = Math.min(100, found.reduce((sum, rule) => sum + rule.weight, 0) + lengthFactor);
    return {
      riskScore,
      issues: found.map((rule) => rule.issue),
      summary: found.length ? `Found ${found.length} risk factor(s).` : "No notable risk factors found.",
    };
  }
}
