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

const RULES: { pattern: RegExp; issue: string; weight: number }[] = [
  { pattern: /terminat/i, issue: "Termination clause", weight: 8 },
  { pattern: /liabilit/i, issue: "Liability risk", weight: 13 },
  { pattern: /payment|invoice/i, issue: "Payment condition", weight: 10 },
  { pattern: /penalt/i, issue: "Penalty clause", weight: 12 },
  { pattern: /indemnif/i, issue: "Indemnification obligation", weight: 15 },
  { pattern: /confidential/i, issue: "Confidentiality obligation", weight: 4 },
  { pattern: /auto(matic)?(ally)?[- ]?renew/i, issue: "Automatic renewal", weight: 9 },
];

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
