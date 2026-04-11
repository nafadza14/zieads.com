import jsPDF from 'jspdf';

const P = '#7B2FBE';

export interface PDFGenerationOptions {
  isAgency: boolean;
  agencyName?: string;
  agencyLogo?: string;
}

export async function generatePDF(reportData: any, options: PDFGenerationOptions = { isAgency: false }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const addPageHeader = (title: string) => {
    doc.setFillColor(123, 47, 190); // P color
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 38);
    
    // Agency White-label Branding in Header
    if (options.isAgency && options.agencyName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const agencyTw = doc.getTextWidth(options.agencyName);
      doc.text(options.agencyName, pageWidth - margin - agencyTw, 38);
    }
    
    y = 90;
  };

  const addFooter = () => {
    if (!options.isAgency) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Powered by ZieAds Strategy Engine', margin, pageHeight - 20);
    } else if (options.agencyName) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Powered by ${options.agencyName}`, margin, pageHeight - 20);
    }
  };

  const checkPageBreak = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - margin - 20) {
      addFooter();
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const writeText = (text: string, x: number, lineH: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text || '', maxWidth);
    doc.text(lines, x, y);
    y += lines.length * lineH;
  };

  const { deliverables } = reportData;
  if (!deliverables) {
    console.error('Invalid report data format for PDF generation');
    return;
  }

  // --- PAGE 1: COVER PAGE ---
  const { coverPage } = deliverables;
  doc.setFillColor(123, 47, 190);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  
  // Center text
  let lines = doc.splitTextToSize(coverPage?.title || 'Paid Ads Strategy Report', pageWidth - margin * 2);
  let startY = 300;
  lines.forEach((line: string) => {
    const w = doc.getTextWidth(line);
    doc.text(line, (pageWidth - w) / 2, startY);
    startY += 40;
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  const subTw = doc.getTextWidth(coverPage?.subtitle || 'Diagnostic & Opportunity Roadmap');
  doc.text(coverPage?.subtitle || 'Diagnostic & Opportunity Roadmap', (pageWidth - subTw) / 2, startY + 20);

  doc.setFontSize(14);
  const prepText = `Prepared for: ${coverPage?.preparedFor || 'Your Business'}`;
  const prepTw = doc.getTextWidth(prepText);
  doc.text(prepText, (pageWidth - prepTw) / 2, pageHeight - 120);

  const dateText = coverPage?.date || new Date().toLocaleDateString();
  const dateTw = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateTw) / 2, pageHeight - 100);

  addFooter();
  doc.addPage();
  y = margin;

  // --- PAGE 2: EXECUTIVE SUMMARY ---
  addPageHeader('Executive Summary');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  writeText(deliverables.executiveSummary || '', margin, 18, pageWidth - margin * 2);

  // --- SCORE BREAKDOWN ---
  y += 30;
  checkPageBreak(150);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Score Breakdown', margin, y);
  y += 30;

  if (deliverables.scoreBreakdown && Array.isArray(deliverables.scoreBreakdown)) {
    deliverables.scoreBreakdown.forEach((s: any) => {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${s.dimension}: ${s.score}/100`, margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      writeText(s.summary, margin, 16, pageWidth - margin * 2);
      y += 10;
    });
  }

  addFooter();
  doc.addPage();
  y = margin;

  // --- PAGE 3: TOP FINDINGS ---
  addPageHeader('Critical Findings');
  if (deliverables.topFindings && Array.isArray(deliverables.topFindings)) {
    deliverables.topFindings.forEach((f: any) => {
      checkPageBreak(80);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`[${f.severity || 'HIGH'}]`, margin, y);
      doc.setTextColor(0, 0, 0);
      doc.text(f.title || '', margin + 70, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      writeText(`Impact: ${f.description}`, margin + 20, 16, pageWidth - margin * 2 - 20);
      writeText(`Fix: ${f.fix}`, margin + 20, 16, pageWidth - margin * 2 - 20);
      y += 15;
    });
  } else {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('No critical findings detected.', margin, y);
    y += 20;
  }

  // --- RECOMMENDATIONS ---
  y += 20;
  checkPageBreak(100);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Recommendations', margin, y);
  y += 30;

  if (deliverables.recommendations && Array.isArray(deliverables.recommendations)) {
    deliverables.recommendations.forEach((r: any) => {
      checkPageBreak(60);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${r.priority || 'P1'}: ${r.action}`, margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      writeText(`Expected Impact: ${r.expectedImpact}`, margin + 20, 16, pageWidth - margin * 2 - 20);
      y += 10;
    });
  }

  addFooter();
  doc.addPage();
  y = margin;

  // --- NEXT STEPS ---
  addPageHeader('Next Steps (90-Day Plan)');
  doc.setTextColor(0, 0, 0);
  if (deliverables.nextSteps && Array.isArray(deliverables.nextSteps)) {
    deliverables.nextSteps.forEach((step: string, index: number) => {
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, margin, y);
      doc.setFont('helvetica', 'normal');
      writeText(step, margin + 20, 18, pageWidth - margin * 2 - 20);
      y += 10;
    });
  }

  addFooter();
  
  doc.save('ZieAds-Strategy-Report.pdf');
}
