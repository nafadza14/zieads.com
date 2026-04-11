import type { AgentResult, AgentFinding } from "./agents.js";

export interface AuditScore {
  overall: number;
  grade: string;
  dimensions: {
    name: string;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
  findings: (AgentFinding & { agent: string })[];
  actionPlan: {
    quickWins: string[];
    mediumTerm: string[];
    strategic: string[];
  };
  platformPriority: { platform: string; reason: string; estimatedCPA: string }[];
}

const DIMENSION_WEIGHTS: Record<string, number> = {
  "Creative & Offer Strength": 0.25,
  "Audience Clarity": 0.20,
  "Landing Page Conversion": 0.20,
  "Platform Fit": 0.15,
  "Funnel Coverage": 0.10,
  "Competitive Positioning": 0.10,
};

function getGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

export function synthesizeReport(agentResults: AgentResult[]): AuditScore {
  const dimensions: AuditScore["dimensions"] = [];

  // Map agent results to dimensions
  for (const result of agentResults) {
    if (result.agentName === "funnel-conversion") {
      // This agent produces two dimension scores
      const lpScore = result.deliverables?.landingPageScore ?? result.score;
      const funnelScore = result.deliverables?.funnelScore ?? result.score;

      dimensions.push({
        name: "Landing Page Conversion",
        score: lpScore,
        weight: DIMENSION_WEIGHTS["Landing Page Conversion"],
        weightedScore: Math.round(lpScore * DIMENSION_WEIGHTS["Landing Page Conversion"]),
      });
      dimensions.push({
        name: "Funnel Coverage",
        score: funnelScore,
        weight: DIMENSION_WEIGHTS["Funnel Coverage"],
        weightedScore: Math.round(funnelScore * DIMENSION_WEIGHTS["Funnel Coverage"]),
      });
    } else {
      const dimName = result.dimension || mapAgentToDimension(result.agentName);
      const weight = DIMENSION_WEIGHTS[dimName] || 0.1;
      dimensions.push({
        name: dimName,
        score: result.score,
        weight,
        weightedScore: Math.round(result.score * weight),
      });
    }
  }

  // Calculate overall score
  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  // Collect and rank all findings
  const allFindings: (AgentFinding & { agent: string })[] = [];
  for (const result of agentResults) {
    for (const finding of result.findings) {
      allFindings.push({ ...finding, agent: result.agentName });
    }
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allFindings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Generate action plan from findings
  const actionPlan = {
    quickWins: allFindings
      .filter((f) => f.severity === "critical" || f.severity === "high")
      .slice(0, 5)
      .map((f) => f.recommendation),
    mediumTerm: allFindings
      .filter((f) => f.severity === "medium")
      .slice(0, 5)
      .map((f) => f.recommendation),
    strategic: allFindings
      .filter((f) => f.severity === "low")
      .slice(0, 3)
      .map((f) => f.recommendation),
  };

  // Generate platform priority from platform-budget agent
  const platformAgent = agentResults.find(
    (r) => r.agentName === "platform-budget"
  );
  const platformPriority: AuditScore["platformPriority"] =
    platformAgent?.deliverables?.platformRanking?.slice(0, 3).map(
      (p: any) => ({
        platform: p.platform,
        reason: p.reason,
        estimatedCPA: p.primaryKPI || "N/A",
      })
    ) || [];

  return {
    overall,
    grade: getGrade(overall),
    dimensions,
    findings: allFindings,
    actionPlan,
    platformPriority,
  };
}

function mapAgentToDimension(agentName: string): string {
  const map: Record<string, string> = {
    "creative-intelligence": "Creative & Offer Strength",
    "audience-targeting": "Audience Clarity",
    "competitive-intelligence": "Competitive Positioning",
    "platform-budget": "Platform Fit",
    "funnel-conversion": "Landing Page Conversion",
  };
  return map[agentName] || agentName;
}
