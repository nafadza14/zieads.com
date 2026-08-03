import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  isAgency: boolean;
  agencyName?: string;
  agencyLogo?: string;
}

// ─── Color palette ─────────────────────────────────────────────────────────
const PURPLE = [123, 47, 190] as const;
const DARK   = [15, 23, 42] as const;
const MID    = [71, 85, 105] as const;
const LIGHT  = [148, 163, 184] as const;
const RULE   = [226, 232, 240] as const;
const PAGE_BG = [250, 250, 252] as const;
const WHITE  = [255, 255, 255] as const;

type RGB = readonly [number, number, number];
function rgb(doc: jsPDF, c: RGB) { doc.setTextColor(c[0], c[1], c[2]); }
function fill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

// ─── generateSkillPDF — universal skill report PDF ──────────────────────────
export async function generateSkillPDF(
  skillTitle: string,
  skillName: string,
  businessName: string,
  url: string,
  result: any,
  options: PDFGenerationOptions = { isAgency: false }
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = PW - M * 2;
  let y = 0;

  // ─── Helpers ───────────────────────────────────────────────────────
  const newPage = () => {
    addFooter();
    doc.addPage();
    y = M;
  };

  const guard = (need: number) => { if (y + need > PH - 60) newPage(); };

  const line = (x1: number, y1: number, x2: number, y2: number, c: RGB = RULE) => {
    stroke(doc, c);
    doc.setLineWidth(0.5);
    doc.line(x1, y1, x2, y2);
  };

  const rule = () => {
    line(M, y, PW - M, y);
    y += 16;
  };

  const text = (s: string, x: number, options?: any) => doc.text(s, x, y, options);

  const para = (s: string, maxW: number, lineH = 15) => {
    const lines = doc.splitTextToSize(s || '', maxW);
    doc.text(lines, M, y);
    y += lines.length * lineH + 4;
  };

  const label = (s: string) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    rgb(doc, PURPLE);
    doc.text(s.toUpperCase(), M, y);
    y += 13;
  };

  const h1 = (s: string) => {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    rgb(doc, DARK);
    doc.text(s, M, y);
    y += 28;
  };

  const h2 = (s: string) => {
    guard(36);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    rgb(doc, DARK);
    doc.text(s, M, y);
    y += 20;
  };

  const body = (s: string) => {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    rgb(doc, MID);
    para(s, CW);
  };

  const chip = (s: string, x: number, chipY: number, chipColor: RGB = PURPLE) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    const tw = doc.getTextWidth(s) + 10;
    fill(doc, [chipColor[0], chipColor[1], chipColor[2]]);
    doc.setGState(doc.GState({ opacity: 0.12 }));
    doc.roundedRect(x, chipY - 8, tw, 12, 2, 2, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    rgb(doc, chipColor);
    doc.text(s, x + 5, chipY);
    return tw + 4;
  };

  const scoreBox = (score: number, boxX: number, boxY: number) => {
    const color: RGB = score >= 70 ? [0, 168, 120] : score >= 50 ? [217, 119, 6] : [220, 38, 38];
    fill(doc, WHITE);
    stroke(doc, RULE);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, boxY, 60, 60, 4, 4, 'FD');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    rgb(doc, color);
    const tw = doc.getTextWidth(String(score));
    doc.text(String(score), boxX + 30 - tw / 2, boxY + 34);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    rgb(doc, LIGHT);
    const lw = doc.getTextWidth('/100');
    doc.text('/100', boxX + 30 - lw / 2, boxY + 46);
  };

  const addFooter = () => {
    const brand = options.isAgency && options.agencyName ? options.agencyName : 'ZieAds';
    stroke(doc, RULE);
    doc.setLineWidth(0.4);
    doc.line(M, PH - 40, PW - M, PH - 40);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    rgb(doc, LIGHT);
    doc.text(`${brand} · ${skillTitle}`, M, PH - 28);
    const pg = String(doc.getCurrentPageInfo().pageNumber);
    doc.text(pg, PW - M, PH - 28, { align: 'right' });
  };

  // ─── COVER PAGE ────────────────────────────────────────────────────
  fill(doc, DARK);
  doc.rect(0, 0, PW, PH, 'F');

  // accent bar left
  fill(doc, PURPLE);
  doc.rect(0, 0, 4, PH, 'F');

  // Brand name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  rgb(doc, [255, 255, 255]);
  doc.setGState(doc.GState({ opacity: 0.5 }));
  const brand = options.isAgency && options.agencyName ? options.agencyName : 'ZieAds';
  doc.text(brand.toUpperCase(), M, 60);
  doc.setGState(doc.GState({ opacity: 1 }));

  // Title block
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  rgb(doc, [255, 255, 255]);
  const titleLines = doc.splitTextToSize(skillTitle, PW - M * 2 - 60);
  let ty = 200;
  titleLines.forEach((l: string) => { doc.text(l, M, ty); ty += 38; });

  // Divider
  fill(doc, PURPLE);
  doc.rect(M, ty + 8, 40, 2, 'F');
  ty += 28;

  // Business / URL
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  rgb(doc, [255, 255, 255]);
  doc.setGState(doc.GState({ opacity: 0.7 }));
  doc.text(businessName || url, M, ty);
  ty += 18;
  doc.setFontSize(9);
  doc.text(url, M, ty);
  doc.setGState(doc.GState({ opacity: 1 }));

  // Score if available
  if (result?.score) {
    scoreBox(result.score, PW - M - 70, PH - 180);
  }

  // Date
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  rgb(doc, [255, 255, 255]);
  doc.setGState(doc.GState({ opacity: 0.4 }));
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), M, PH - 60);
  doc.setGState(doc.GState({ opacity: 1 }));

  // ─── PAGE 2 — EXECUTIVE SUMMARY + SCORE ───────────────────────────
  doc.addPage();
  fill(doc, PAGE_BG);
  doc.rect(0, 0, PW, PH, 'F');
  y = M;

  label('Intelligence Brief');
  h1(`${skillTitle} Analysis`);
  rule();

  // Score + summary side by side if score exists
  if (result?.score) {
    scoreBox(result.score, PW - M - 60, M);
  }

  const summary = result?.deliverables?.executiveSummary
    || result?.deliverables?.executiveBrief?.summary
    || result?.analysis?.strategy
    || `This report covers the ${skillTitle.toLowerCase()} for ${businessName || url}. Review each section for prioritized recommendations.`;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  rgb(doc, MID);
  const summaryLines = doc.splitTextToSize(summary, CW - 80);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 14 + 20;

  // ─── KEY FINDINGS ─────────────────────────────────────────────────
  const findings = result?.findings || [];
  if (findings.length > 0) {
    rule();
    h2('Key Findings');
    const sevColor: Record<string, RGB> = {
      critical: [220, 38, 38],
      high: [217, 119, 6],
      medium: [2, 132, 199],
      low: [22, 163, 74],
    };
    findings.slice(0, 6).forEach((f: any) => {
      guard(56);
      const sev = (f.severity || 'medium').toLowerCase();
      const col = sevColor[sev] || sevColor.medium;
      // Severity dot
      fill(doc, col);
      doc.circle(M + 4, y - 4, 3, 'F');
      // Title
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      rgb(doc, DARK);
      doc.text(f.title || '', M + 14, y);
      y += 13;
      if (f.impact) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        rgb(doc, MID);
        const iLines = doc.splitTextToSize(`Impact: ${f.impact}`, CW - 14);
        doc.text(iLines, M + 14, y);
        y += iLines.length * 12;
      }
      if (f.recommendation) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        rgb(doc, PURPLE);
        const rLines = doc.splitTextToSize(`Fix: ${f.recommendation}`, CW - 14);
        doc.text(rLines, M + 14, y);
        y += rLines.length * 12;
      }
      y += 10;
    });
  }

  // ─── DELIVERABLES (key sections only) ────────────────────────────
  const d = result?.deliverables || {};

  // Helper: render a simple key-value section
  const kvSection = (title: string, items: Array<[string, string]>) => {
    if (items.length === 0) return;
    newPage();
    h2(title);
    rule();
    items.forEach(([k, v]) => {
      guard(40);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      rgb(doc, DARK);
      doc.text(k, M, y);
      y += 13;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      rgb(doc, MID);
      const vLines = doc.splitTextToSize(String(v || ''), CW);
      doc.text(vLines, M, y);
      y += vLines.length * 13 + 8;
    });
  };

  // Render top-level string fields as a summary page
  const summaryItems: Array<[string, string]> = [];
  const skipKeys = new Set(['executiveSummary', 'executiveBrief', 'coverPage', 'auditScores', 'nextSteps', 'benchmarksAppendix']);
  Object.entries(d).forEach(([k, v]) => {
    if (skipKeys.has(k)) return;
    if (typeof v === 'string' && v.length > 20) {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
      summaryItems.push([label, v]);
    }
  });
  if (summaryItems.length > 0) kvSection('Strategy Details', summaryItems);

  // Recommendations
  const recs = d.recommendations || d.nextSteps || d.funnelBuildSequence;
  if (Array.isArray(recs) && recs.length > 0) {
    newPage();
    h2('Recommendations');
    rule();
    recs.slice(0, 12).forEach((r: any, i: number) => {
      guard(50);
      const rankLabel = typeof r === 'string' ? `${i + 1}.` : `${i + 1}.`;
      const title = typeof r === 'string' ? r : (r.title || r.action || r.step || '');
      const detail = typeof r === 'string' ? '' : (r.expectedImpact || r.impact || r.why || '');
      const effort = typeof r === 'string' ? '' : (r.effort || r.timeline || '');

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      rgb(doc, DARK);
      doc.text(`${rankLabel} ${title}`, M, y);
      y += 14;
      if (detail) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        rgb(doc, MID);
        const dLines = doc.splitTextToSize(detail, CW - 16);
        doc.text(dLines, M + 14, y);
        y += dLines.length * 12;
      }
      if (effort) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        rgb(doc, LIGHT);
        doc.text(`Effort: ${effort}`, M + 14, y);
        y += 12;
      }
      y += 6;
    });
  }

  // 90-day plan or milestones
  const plan = d.ninetyDayPlan || d.monthlyPlan || d.launchPlan;
  if (Array.isArray(plan) && plan.length > 0) {
    newPage();
    h2('90-Day Action Plan');
    rule();
    plan.forEach((phase: any) => {
      guard(60);
      const ph = typeof phase === 'string' ? phase : (phase.phase || phase.week || phase.month || '');
      const focus = typeof phase === 'string' ? '' : (phase.focus || phase.milestone || '');
      const actions = typeof phase === 'string' ? [] : (Array.isArray(phase.actions) ? phase.actions : []);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      rgb(doc, PURPLE);
      doc.text(String(ph), M, y);
      y += 14;
      if (focus) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        rgb(doc, DARK);
        doc.text(focus, M + 10, y);
        y += 13;
      }
      actions.slice(0, 4).forEach((a: string) => {
        guard(20);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        rgb(doc, MID);
        const aLines = doc.splitTextToSize(`• ${a}`, CW - 20);
        doc.text(aLines, M + 14, y);
        y += aLines.length * 12;
      });
      y += 10;
    });
  }

  // KPI benchmarks table
  const kpis = d.kpiBenchmarks || d.benchmarksAppendix;
  if (kpis && typeof kpis === 'object' && !Array.isArray(kpis)) {
    newPage();
    h2('KPI Benchmarks');
    rule();
    const entries = Object.entries(kpis);
    if (entries.length > 0) {
      // Table header
      const cols = [M, M + 80, M + 200, M + 310];
      const colW = [70, 120, 110, 90];
      fill(doc, [245, 247, 250]);
      doc.rect(M - 4, y - 10, CW + 8, 18, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      rgb(doc, MID);
      ['Platform', 'Metric', 'Value', 'Status'].forEach((h, i) => doc.text(h, cols[i], y));
      y += 14;

      entries.forEach(([platform, metrics]: [string, any]) => {
        if (typeof metrics !== 'object') return;
        Object.entries(metrics).forEach(([metric, value]: [string, any]) => {
          guard(18);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          rgb(doc, DARK);
          doc.text(platform, cols[0], y, { maxWidth: colW[0] });
          doc.text(metric, cols[1], y, { maxWidth: colW[1] });
          doc.text(String(value), cols[2], y, { maxWidth: colW[2] });
          y += 14;
        });
      });
    }
  }

  addFooter();
  doc.save(`ZieAds-${skillName}-report.pdf`);
}

// ─── generatePDF — legacy ClientDashboard PDF ──────────────────────────────
export async function generatePDF(reportData: any, options: PDFGenerationOptions = { isAgency: false }) {
  const d = reportData?.deliverables;
  const businessName = reportData?.coverPage?.preparedFor || reportData?.preparedFor || 'Your Business';
  await generateSkillPDF(
    'Paid Ads Strategy Report',
    'report-pdf',
    businessName,
    '',
    reportData,
    options
  );
}
