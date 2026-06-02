import { jsPDF } from 'jspdf';
import type { ParsedData, KPI, Insight, Recommendation, BusinessScore } from '../types';
import { formatINRAbbreviated, formatIndianNumber } from './formatters';

// Executive Color Palette
const COLORS = {
  navy: [10, 15, 30] as [number, number, number],
  purple: [108, 99, 255] as [number, number, number],
  cyan: [0, 229, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  gray100: [240, 240, 245] as [number, number, number],
  gray200: [220, 220, 230] as [number, number, number],
  gray400: [150, 150, 160] as [number, number, number],
  gray600: [100, 100, 110] as [number, number, number],
};

/**
 * Draw a partial circle arc using lines (jsPDF-compatible)
 */
function drawArc(doc: jsPDF, x: number, y: number, radius: number, startAngle: number, endAngle: number, style: 'S' | 'F' = 'S'): void {
  const steps = 60;
  const angleStep = (endAngle - startAngle) / steps;

  doc.setLineDash([]);
  doc.setLineWidth(8);

  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + i * angleStep;
    const a2 = startAngle + (i + 1) * angleStep;

    const x1 = x + radius * Math.cos(a1);
    const y1 = y + radius * Math.sin(a1);
    const x2 = x + radius * Math.cos(a2);
    const y2 = y + radius * Math.sin(a2);

    doc.line(x1, y1, x2, y2);
  }
}

/**
 * Generate Executive PDF Report
 */
export function generateExecutivePDF(data: ParsedData, kpis: KPI[], insights: Insight[], recommendations: Recommendation[], score: BusinessScore): void {
  console.log('Executive PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // ===== COVER PAGE =====
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Brand
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 40);

  // Title
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text('Executive Summary Report', margin, 80);

  // Subtitle line
  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 90, margin + 100, 90);

  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dataset: ${data.fileName}`, margin, 110);
  doc.text(`Records: ${formatIndianNumber(data.rowCount)} | Columns: ${data.columnCount}`, margin, 122);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 134);

  // Health Score Circle
  const centerX = pageWidth / 2;
  const centerY = 190;
  const radius = 35;

  // Background circle
  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(8);
  doc.circle(centerX, centerY, radius, 'S');

  // Progress arc
  const scoreAngle = (score.overall / 100) * 2 * Math.PI - Math.PI / 2;
  doc.setDrawColor(...COLORS.purple);
  drawArc(doc, centerX, centerY, radius, -Math.PI / 2, scoreAngle, 'S');

  // Score text
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), centerX, centerY + 5, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.text('BUSINESS HEALTH', centerX, centerY + 15, { align: 'center' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Confidential Business Intelligence Report', margin, pageHeight - 30);
  doc.text('Page 1', pageWidth - margin, pageHeight - 30, { align: 'right' });

  // ===== SECTION 1: EXECUTIVE SUMMARY =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Executive Summary', margin, 38);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.text('Dataset: ' + data.fileName, pageWidth - margin, 38, { align: 'right' });

  y = 70;

  // Summary box
  const summaryInsight = insights.find(i => i.type === 'summary');
  if (summaryInsight) {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 4, 4, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', margin + 10, y + 15);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summaryInsight.description, pageWidth - margin * 2 - 20);
    summaryLines.slice(0, 3).forEach((line: string, i: number) => {
      doc.text(line, margin + 10, y + 28 + i * 6);
    });

    y += 60;
  }

  // Growth indicator
  const growthKpi = kpis.find(k => k.label.toLowerCase().includes('growth') || k.label.toLowerCase().includes('revenue'));
  if (growthKpi) {
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Trend', margin, y);
    y += 10;

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 4, 4, 'F');

    doc.setFontSize(24);
    doc.setTextColor(...COLORS.purple);
    doc.text(String(growthKpi.value), margin + 15, y + 22);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.text(growthKpi.label, margin + 15, y + 30);

    const changeText = `${growthKpi.change >= 0 ? '+' : ''}${growthKpi.change}%`;
    doc.setFontSize(14);
    doc.setTextColor(...(growthKpi.change >= 0 ? COLORS.cyan : [239, 68, 68] as [number, number, number]));
    doc.text(changeText, pageWidth - margin - 15, y + 22, { align: 'right' });

    y += 50;
  }

  // Key findings preview
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Findings', margin, y);
  y += 10;

  insights.filter(i => i.type !== 'summary').slice(0, 4).forEach((insight) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.type.toUpperCase(), margin + 8, y + 10);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text(insight.title, margin + 8, y + 20);

    y += 35;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 2', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== SECTION 2: KPIs =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Key Performance Indicators', margin, 38);

  y = 65;

  // KPI Grid
  const kpiCols = 2;
  const kpiWidth = (pageWidth - margin * 2 - 10) / kpiCols;
  const kpiHeight = 45;

  kpis.slice(0, 6).forEach((kpi, i) => {
    const col = i % kpiCols;
    const row = Math.floor(i / kpiCols);
    const kpiX = margin + col * (kpiWidth + 10);
    const kpiY = y + row * (kpiHeight + 10);

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(kpiX, kpiY, kpiWidth, kpiHeight, 4, 4, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), kpiX + 10, kpiY + 12);

    doc.setFontSize(18);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), kpiX + 10, kpiY + 30);

    const changeColor = kpi.change >= 0 ? COLORS.cyan : [239, 68, 68] as [number, number, number];
    doc.setFontSize(10);
    doc.setTextColor(...changeColor);
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, kpiX + kpiWidth - 10, kpiY + 30, { align: 'right' });
  });

  y += Math.ceil(Math.min(kpis.length, 6) / kpiCols) * (kpiHeight + 10) + 10;

  // Health Dimensions
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Business Health Dimensions', margin, y);
  y += 10;

  const dimensions = [
    { label: 'Growth', value: score.growth },
    { label: 'Profitability', value: score.profitability },
    { label: 'Stability', value: score.stability },
    { label: 'Risk Management', value: score.risk },
  ];

  dimensions.forEach((dim) => {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(dim.label, margin, y);

    const barWidth = pageWidth - margin * 2 - 60;
    const dimBarHeight = 8;
    const dimFillWidth = (dim.value / 100) * barWidth;

    doc.setFillColor(...COLORS.gray200);
    doc.roundedRect(margin + 60, y - 5, barWidth, dimBarHeight, 2, 2, 'F');
    doc.setFillColor(...COLORS.purple);
    doc.roundedRect(margin + 60, y - 5, dimFillWidth, dimBarHeight, 2, 2, 'F');

    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dim.value}`, pageWidth - margin, y, { align: 'right' });

    y += 18;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 3', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== SECTION 3: INSIGHTS =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Business Insights', margin, 38);

  y = 65;

  insights.forEach((insight) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 30;
    }

    const typeColors: Record<string, [number, number, number]> = {
      summary: COLORS.purple,
      finding: COLORS.cyan,
      driver: [16, 185, 129] as [number, number, number],
      risk: [245, 158, 11] as [number, number, number],
      opportunity: COLORS.purple,
      outlier: [239, 68, 68] as [number, number, number],
    };

    const cardHeight = 35;
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, cardHeight, 4, 4, 'F');

    doc.setFillColor(...(typeColors[insight.type] || COLORS.purple));
    doc.roundedRect(margin + 5, y + 5, 50, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.type.toUpperCase(), margin + 30, y + 11, { align: 'center' });

    const impactColors: Record<string, [number, number, number]> = {
      high: [239, 68, 68] as [number, number, number],
      medium: [245, 158, 11] as [number, number, number],
      low: [16, 185, 129] as [number, number, number],
    };
    doc.setFillColor(...(impactColors[insight.impact] || COLORS.gray400));
    doc.roundedRect(margin + 60, y + 5, 35, 10, 2, 2, 'F');
    doc.text(insight.impact.toUpperCase(), margin + 77, y + 11, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text(insight.title, margin + 10, y + 27);

    y += cardHeight + 8;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 4', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== SECTION 4: RECOMMENDATIONS =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Strategic Recommendations', margin, 38);

  y = 65;

  recommendations.forEach((rec, idx) => {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 30;
    }

    const priorityColors: Record<string, [number, number, number]> = {
      critical: [239, 68, 68] as [number, number, number],
      high: [245, 158, 11] as [number, number, number],
      medium: COLORS.cyan as [number, number, number],
    };

    const cardHeight = 50;
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, cardHeight, 4, 4, 'F');

    doc.setFillColor(...COLORS.purple);
    doc.circle(margin + 15, y + 15, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text((idx + 1).toString(), margin + 15, y + 18, { align: 'center' });

    doc.setFillColor(...(priorityColors[rec.priority] || COLORS.gray400));
    doc.roundedRect(margin + 28, y + 10, 40, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.text(rec.priority.toUpperCase(), margin + 48, y + 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(rec.title, margin + 10, y + 32);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(`Action: ${rec.action}`, pageWidth - margin * 2 - 20);
    doc.text(actionLines[0], margin + 10, y + 42);

    y += cardHeight + 10;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 5', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== SECTION 5: CONCLUSION =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 40);

  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.text('Conclusion', margin, 80);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 90, margin + 60, 90);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  doc.text('Business Health Score', margin, 120);

  doc.setFontSize(48);
  doc.setTextColor(...COLORS.purple);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), margin, 155);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.cyan);
  doc.text(score.overall >= 70 ? 'Strong Performance' : score.overall >= 40 ? 'Moderate Performance' : 'Needs Improvement', margin, 175);

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Strengths', margin, 210);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  score.strengths.forEach((s, i) => {
    doc.text(`+ ${s}`, margin, 225 + i * 12);
  });

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Improvement', pageWidth / 2 + 10, 210);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  score.weaknesses.forEach((w, i) => {
    doc.text(`- ${w}`, pageWidth / 2 + 10, 225 + i * 12);
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Generated by Nexora AI | Confidential', margin, pageHeight - 30);
  doc.text('Page 6', pageWidth - margin, pageHeight - 30, { align: 'right' });

  const fileName = `NexoraAI_Executive_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Executive PDF saved:', fileName);
}

/**
 * Generate KPI-focused PDF
 */
export function generateKPIPDF(data: ParsedData, kpis: KPI[], score: BusinessScore): void {
  console.log('KPI PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Cover
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 30);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('KPI Performance Report', margin, 70);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 80, margin + 80, 80);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 100);
  doc.text(`${formatIndianNumber(data.rowCount)} records analyzed`, margin, 115);

  // Main score circle
  const centerX = pageWidth / 2;
  const centerY = 180;
  const radius = 40;

  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(10);
  doc.circle(centerX, centerY, radius, 'S');

  doc.setDrawColor(...COLORS.purple);
  drawArc(doc, centerX, centerY, radius, Math.PI / 2, Math.PI / 2 - (score.overall / 100) * 2 * Math.PI, 'S');

  doc.setFontSize(36);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), centerX, centerY + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray400);
  doc.text('OVERALL SCORE', centerX, centerY + 25, { align: 'center' });

  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Key Performance Indicators', margin, 28);

  y = 55;

  kpis.forEach((kpi, i) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), margin + 12, y + 15);

    doc.setFontSize(22);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), margin + 12, y + 35);

    const changeColor = kpi.change >= 0 ? COLORS.cyan : [239, 68, 68] as [number, number, number];
    doc.setFontSize(12);
    doc.setTextColor(...changeColor);
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, pageWidth - margin - 12, y + 35, { align: 'right' });

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray400);
    doc.text(kpi.explanation, margin + 12, y + 44);

    y += 58;
  });

  // Dimensions
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Dimensions', margin, y);
  y += 12;

  const dims = [
    { label: 'Growth Trajectory', value: score.growth },
    { label: 'Profitability Index', value: score.profitability },
    { label: 'Operational Stability', value: score.stability },
    { label: 'Risk Management', value: score.risk },
  ];

  dims.forEach(dim => {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(dim.label, margin, y);

    const barW = pageWidth - margin * 2 - 50;
    const barH = 8;
    const fillW = (dim.value / 100) * barW;

    doc.setFillColor(...COLORS.gray200);
    doc.roundedRect(margin + 70, y - 5, barW, barH, 2, 2, 'F');
    doc.setFillColor(...COLORS.purple);
    doc.roundedRect(margin + 70, y - 5, fillW, barH, 2, 2, 'F');

    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(`${dim.value}`, pageWidth - margin, y, { align: 'right' });

    y += 16;
  });

  const fileName = `NexoraAI_KPI_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('KPI PDF saved:', fileName);
}

/**
 * Generate Insights-focused PDF
 */
export function generateInsightsPDF(data: ParsedData, insights: Insight[], recommendations: Recommendation[]): void {
  console.log('Insights PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Cover
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 30);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Insights & Recommendations', margin, 70);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 80, margin + 120, 80);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 100);
  doc.text(`${insights.length} insights | ${recommendations.length} recommendations`, margin, 115);

  // Insights page
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Business Insights', margin, 28);

  y = 55;

  insights.forEach((insight) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 30;
    }

    const typeColors: Record<string, [number, number, number]> = {
      summary: COLORS.purple,
      finding: COLORS.cyan,
      driver: [16, 185, 129] as [number, number, number],
      risk: [245, 158, 11] as [number, number, number],
      opportunity: COLORS.purple,
      outlier: [239, 68, 68] as [number, number, number],
    };

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 4, 4, 'F');

    doc.setFillColor(...(typeColors[insight.type] || COLORS.purple));
    doc.roundedRect(margin + 8, y + 8, 45, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.type.toUpperCase(), margin + 30, y + 14, { align: 'center' });

    const impactColors: Record<string, [number, number, number]> = {
      high: [239, 68, 68] as [number, number, number],
      medium: [245, 158, 11] as [number, number, number],
      low: [16, 185, 129] as [number, number, number],
    };
    doc.setFillColor(...(impactColors[insight.impact] || COLORS.gray400));
    doc.roundedRect(margin + 58, y + 8, 35, 10, 2, 2, 'F');
    doc.text(insight.impact.toUpperCase(), margin + 75, y + 14, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.title, margin + 8, y + 28);

    y += 48;
  });

  // Recommendations page
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Strategic Recommendations', margin, 28);

  y = 55;

  recommendations.forEach((rec, idx) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = 30;
    }

    const priorityColors: Record<string, [number, number, number]> = {
      critical: [239, 68, 68] as [number, number, number],
      high: [245, 158, 11] as [number, number, number],
      medium: COLORS.cyan as [number, number, number],
    };

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 55, 4, 4, 'F');

    doc.setFillColor(...COLORS.purple);
    doc.circle(margin + 15, y + 15, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text((idx + 1).toString(), margin + 15, y + 18, { align: 'center' });

    doc.setFillColor(...(priorityColors[rec.priority] || COLORS.gray400));
    doc.roundedRect(margin + 28, y + 10, 40, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.text(rec.priority.toUpperCase(), margin + 48, y + 16, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(rec.title, margin + 8, y + 32);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(rec.action, pageWidth - margin * 2 - 16);
    doc.text(actionLines[0], margin + 8, y + 44);

    doc.setTextColor(...COLORS.cyan);
    doc.text(`Expected: ${rec.expectedImpact}`, margin + 8, y + 52);

    y += 62;
  });

  const fileName = `NexoraAI_Insights_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Insights PDF saved:', fileName);
}

/**
 * Generate Full Business Intelligence Report
 */
export function generateFullReport(data: ParsedData, kpis: KPI[], insights: Insight[], recommendations: Recommendation[], score: BusinessScore): void {
  console.log('Full Report PDF triggered');

  // Generate a combined report with all sections
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // ===== COVER PAGE =====
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 40);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Complete Business Intelligence', margin, 70);
  doc.text('Report', margin, 85);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 95, margin + 100, 95);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 120);
  doc.text(`Records: ${formatIndianNumber(data.rowCount)} | Columns: ${data.columnCount}`, margin, 135);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 150);

  // Health Score
  const centerX = pageWidth / 2;
  const centerY = 210;
  const radius = 35;

  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(8);
  doc.circle(centerX, centerY, radius, 'S');

  doc.setDrawColor(...COLORS.purple);
  drawArc(doc, centerX, centerY, radius, -Math.PI / 2, (score.overall / 100) * 2 * Math.PI - Math.PI / 2, 'S');

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), centerX, centerY + 5, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.text('BUSINESS HEALTH', centerX, centerY + 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Confidential Business Intelligence Report', margin, pageHeight - 30);
  doc.text('Page 1', pageWidth - margin, pageHeight - 30, { align: 'right' });

  // ===== EXECUTIVE SUMMARY =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 20);

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Executive Summary', margin, 38);

  y = 70;

  const summaryInsight = insights.find(i => i.type === 'summary');
  if (summaryInsight) {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 4, 4, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', margin + 10, y + 15);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summaryInsight.description, pageWidth - margin * 2 - 20);
    summaryLines.slice(0, 3).forEach((line: string, i: number) => {
      doc.text(line, margin + 10, y + 28 + i * 6);
    });

    y += 60;
  }

  // Key findings
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Findings', margin, y);
  y += 10;

  insights.filter(i => i.type !== 'summary').slice(0, 4).forEach((insight) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.type.toUpperCase(), margin + 8, y + 10);

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text(insight.title, margin + 8, y + 20);

    y += 35;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 2', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== KPIs =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Key Performance Indicators', margin, 38);

  y = 65;

  const kpiCols = 2;
  const kpiWidth = (pageWidth - margin * 2 - 10) / kpiCols;
  const kpiHeight = 45;

  kpis.slice(0, 6).forEach((kpi, i) => {
    const col = i % kpiCols;
    const row = Math.floor(i / kpiCols);
    const kpiX = margin + col * (kpiWidth + 10);
    const kpiY = y + row * (kpiHeight + 10);

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(kpiX, kpiY, kpiWidth, kpiHeight, 4, 4, 'F');

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), kpiX + 10, kpiY + 12);

    doc.setFontSize(18);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), kpiX + 10, kpiY + 30);

    const changeColor = kpi.change >= 0 ? COLORS.cyan : [239, 68, 68] as [number, number, number];
    doc.setFontSize(10);
    doc.setTextColor(...changeColor);
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, kpiX + kpiWidth - 10, kpiY + 30, { align: 'right' });
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 3', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== INSIGHTS =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Business Insights', margin, 38);

  y = 65;

  insights.slice(0, 6).forEach((insight) => {
    const typeColors: Record<string, [number, number, number]> = {
      summary: COLORS.purple,
      finding: COLORS.cyan,
      driver: [16, 185, 129] as [number, number, number],
      risk: [245, 158, 11] as [number, number, number],
      opportunity: COLORS.purple,
      outlier: [239, 68, 68] as [number, number, number],
    };

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 4, 4, 'F');

    doc.setFillColor(...(typeColors[insight.type] || COLORS.purple));
    doc.roundedRect(margin + 5, y + 5, 50, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(insight.type.toUpperCase(), margin + 30, y + 11, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text(insight.title, margin + 10, y + 27);

    y += 43;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 4', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== RECOMMENDATIONS =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text('Strategic Recommendations', margin, 38);

  y = 65;

  recommendations.slice(0, 6).forEach((rec, idx) => {
    const priorityColors: Record<string, [number, number, number]> = {
      critical: [239, 68, 68] as [number, number, number],
      high: [245, 158, 11] as [number, number, number],
      medium: COLORS.cyan as [number, number, number],
    };

    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 4, 4, 'F');

    doc.setFillColor(...COLORS.purple);
    doc.circle(margin + 15, y + 15, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text((idx + 1).toString(), margin + 15, y + 18, { align: 'center' });

    doc.setFillColor(...(priorityColors[rec.priority] || COLORS.gray400));
    doc.roundedRect(margin + 28, y + 10, 40, 10, 2, 2, 'F');
    doc.setFontSize(7);
    doc.text(rec.priority.toUpperCase(), margin + 48, y + 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text(rec.title, margin + 10, y + 32);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    const actionLines = doc.splitTextToSize(`Action: ${rec.action}`, pageWidth - margin * 2 - 20);
    doc.text(actionLines[0], margin + 10, y + 42);

    y += 58;
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Page 5', pageWidth - margin, pageHeight - 20, { align: 'right' });

  // ===== CONCLUSION =====
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 40);

  doc.setFontSize(24);
  doc.setTextColor(...COLORS.white);
  doc.text('Conclusion', margin, 80);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 90, margin + 60, 90);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  doc.text('Business Health Score', margin, 120);

  doc.setFontSize(48);
  doc.setTextColor(...COLORS.purple);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), margin, 155);

  doc.setFontSize(14);
  doc.setTextColor(...COLORS.cyan);
  doc.text(score.overall >= 70 ? 'Strong Performance' : score.overall >= 40 ? 'Moderate Performance' : 'Needs Improvement', margin, 175);

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Strengths', margin, 210);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  score.strengths.slice(0, 3).forEach((s, i) => {
    doc.text(`+ ${s}`, margin, 225 + i * 12);
  });

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Improvement', pageWidth / 2 + 10, 210);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.setFont('helvetica', 'normal');
  score.weaknesses.slice(0, 3).forEach((w, i) => {
    doc.text(`- ${w}`, pageWidth / 2 + 10, 225 + i * 12);
  });

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray600);
  doc.text('Generated by Nexora AI | Confidential', margin, pageHeight - 30);
  doc.text('Page 6', pageWidth - margin, pageHeight - 30, { align: 'right' });

  const fileName = `NexoraAI_FullReport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Full Report PDF saved:', fileName);
}

/**
 * Generate Health-focused PDF
 */
export function generateHealthPDF(data: ParsedData, score: BusinessScore): void {
  console.log('Health PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Cover
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 30);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Business Health Report', margin, 70);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 80, margin + 100, 80);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 100);
  doc.text(`${formatIndianNumber(data.rowCount)} records analyzed`, margin, 115);

  // Main score
  const centerX = pageWidth / 2;
  const centerY = 180;
  const radius = 40;

  doc.setDrawColor(...COLORS.gray200);
  doc.setLineWidth(10);
  doc.circle(centerX, centerY, radius, 'S');

  doc.setDrawColor(...COLORS.purple);
  drawArc(doc, centerX, centerY, radius, -Math.PI / 2, (score.overall / 100) * 2 * Math.PI - Math.PI / 2, 'S');

  doc.setFontSize(36);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), centerX, centerY + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray400);
  doc.text('HEALTH SCORE', centerX, centerY + 25, { align: 'center' });

  // Dimensions page
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Health Dimensions', margin, 28);

  y = 55;

  const dims = [
    { label: 'Growth Trajectory', value: score.growth, color: COLORS.cyan },
    { label: 'Profitability Index', value: score.profitability, color: COLORS.purple },
    { label: 'Operational Stability', value: score.stability, color: [16, 185, 129] as [number, number, number] },
    { label: 'Risk Management', value: score.risk, color: [245, 158, 11] as [number, number, number] },
  ];

  dims.forEach(dim => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 60, 4, 4, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(dim.label, margin + 12, y + 18);

    doc.setFillColor(...dim.color);
    doc.circle(margin + 30, y + 40, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.text(dim.value.toString(), margin + 30, y + 44, { align: 'center' });

    const barWidth = pageWidth - margin * 2 - 80;
    doc.setFillColor(...COLORS.gray200);
    doc.roundedRect(margin + 60, y + 35, barWidth, 8, 2, 2, 'F');
    doc.setFillColor(...dim.color);
    doc.roundedRect(margin + 60, y + 35, (dim.value / 100) * barWidth, 8, 2, 2, 'F');

    y += 70;
  });

  // Strengths & Weaknesses
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Strengths', margin, y);
  y += 10;

  score.strengths.forEach((s, i) => {
    doc.setFontSize(9);
    doc.setTextColor(...[16, 185, 129]);
    doc.text(`+ ${s}`, margin, y + i * 10);
  });

  y += score.strengths.length * 10 + 15;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Areas for Improvement', margin, y);
  y += 10;

  score.weaknesses.forEach((w, i) => {
    doc.setFontSize(9);
    doc.setTextColor(...[239, 68, 68]);
    doc.text(`- ${w}`, margin, y + i * 10);
  });

  const fileName = `NexoraAI_Health_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Health PDF saved:', fileName);
}

/**
 * Generate Forecast PDF
 */
export function generateForecastPDF(data: ParsedData, kpis: KPI[]): void {
  console.log('Forecast PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Cover
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 30);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Forecast Report', margin, 70);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 80, margin + 80, 80);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 100);
  doc.text('Projections and trend analysis', margin, 115);

  // Projections
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Performance Forecast', margin, 28);

  let y = 55;

  kpis.slice(0, 6).forEach((kpi, i) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 45, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label.toUpperCase(), margin + 12, y + 15);

    doc.setFontSize(18);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), margin + 12, y + 32);

    const projected = kpi.change >= 0 ? '+' + (kpi.change * 1.2).toFixed(1) : (kpi.change * 0.8).toFixed(1);
    doc.setFontSize(10);
    doc.setTextColor(...(kpi.change >= 0 ? COLORS.cyan : [239, 68, 68]));
    doc.fillText(`Projected: ${projected}%`, pageWidth - margin - 12, y + 32, { align: 'right' });

    y += 55;
  });

  const fileName = `NexoraAI_Forecast_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Forecast PDF saved:', fileName);
}

/**
 * Generate Comparison PDF
 */
export function generateComparisonPDF(data: ParsedData, kpis: KPI[]): void {
  console.log('Comparison PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Cover
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXORA AI', margin, 30);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Comparison Report', margin, 70);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 80, margin + 90, 80);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Dataset: ${data.fileName}`, margin, 100);
  doc.text('Segment analysis and rankings', margin, 115);

  // KPI Comparison
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Metric Comparison', margin, 28);

  let y = 55;

  kpis.slice(0, 6).forEach((kpi, i) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, margin + 12, y + 15);

    doc.setFontSize(16);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), margin + 12, y + 30);

    doc.setFontSize(10);
    doc.setTextColor(...(kpi.change >= 0 ? COLORS.cyan : [239, 68, 68]));
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, pageWidth - margin - 12, y + 30, { align: 'right' });

    y += 48;
  });

  const fileName = `NexoraAI_Comparison_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Comparison PDF saved:', fileName);
}

/**
 * Generate Board Meeting Report PDF
 */
export function generateBoardReportPDF(data: ParsedData, kpis: KPI[], insights: Insight[], recommendations: Recommendation[], score: BusinessScore): void {
  console.log('Board Report PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Cover - Professional
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('BOARD MEETING REPORT', margin, 40);

  doc.setFontSize(32);
  doc.setTextColor(...COLORS.white);
  doc.text('Executive Summary', margin, 90);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 100, margin + 120, 100);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 130);
  doc.text(`Dataset: ${data.fileName}`, margin, 145);
  doc.text(`Records: ${formatIndianNumber(data.rowCount)}`, margin, 160);

  // Score box
  doc.setFillColor(255, 255, 255, 0.05);
  doc.roundedRect(margin, 190, pageWidth - margin * 2, 60, 4, 4, 'F');

  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray400);
  doc.text('Overall Business Health', margin + 15, 210);

  doc.setFontSize(48);
  doc.setTextColor(...COLORS.purple);
  doc.setFont('helvetica', 'bold');
  doc.text(score.overall.toString(), margin + 15, 245);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Status: ${score.overall >= 70 ? 'Strong' : score.overall >= 50 ? 'Moderate' : 'Needs Attention'}`);

  // Key Metrics
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Key Performance Metrics', margin, 28);

  y = 55;

  kpis.slice(0, 4).forEach((kpi, i) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, margin + 10, y + 12);

    doc.setFontSize(14);
    doc.setTextColor(...COLORS.purple);
    doc.setFont('helvetica', 'bold');
    doc.text(String(kpi.value), margin + 10, y + 27);

    doc.setFontSize(10);
    doc.setTextColor(...(kpi.change >= 0 ? COLORS.cyan : [239, 68, 68]));
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, pageWidth - margin - 10, y + 27, { align: 'right' });

    y += 42;
  });

  // Strategic Priorities
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Strategic Priorities', margin, y);
  y += 10;

  recommendations.slice(0, 3).forEach((rec, i) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');

    doc.setFillColor(...COLORS.purple);
    doc.circle(margin + 12, y + 15, 6, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.white);
    doc.text((i + 1).toString(), margin + 12, y + 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.navy);
    doc.text(rec.title, margin + 24, y + 18);

    y += 36;
  });

  const fileName = `NexoraAI_BoardReport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Board Report PDF saved:', fileName);
}

/**
 * Generate Investor Report PDF
 */
export function generateInvestorReportPDF(data: ParsedData, kpis: KPI[], insights: Insight[], score: BusinessScore): void {
  console.log('Investor Report PDF triggered');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 0;

  // Cover - Professional
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTOR REPORT', margin, 40);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text('Business Intelligence', margin, 80);
  doc.text('Overview', margin, 100);

  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(2);
  doc.line(margin, 110, margin + 80, 110);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gray400);
  doc.text(`Analysis Date: ${new Date().toLocaleDateString('en-IN')}`, margin, 135);
  doc.text(`Dataset: ${data.fileName}`, margin, 150);

  // Investment Highlights
  doc.addPage();
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(16);
  doc.setTextColor(...COLORS.white);
  doc.text('Investment Highlights', margin, 28);

  y = 55;

  // Health Score Box
  doc.setFillColor(...COLORS.purple);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 50, 4, 4, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray100);
  doc.text('BUSINESS HEALTH SCORE', margin + 15, y + 18);

  doc.setFontSize(28);
  doc.setTextColor(...COLORS.white);
  doc.text(score.overall.toString(), margin + 15, y + 40);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.cyan);
  doc.text(score.overall >= 70 ? 'Strong Investment Potential' : score.overall >= 50 ? 'Moderate Potential' : 'Requires Review');

  y += 65;

  // Key Metrics
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', margin, y);
  y += 10;

  kpis.slice(0, 4).forEach((kpi) => {
    doc.setFillColor(...COLORS.gray100);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray600);
    doc.text(kpi.label, margin + 10, y + 12);

    doc.setFontSize(12);
    doc.setTextColor(...COLORS.navy);
    doc.text(String(kpi.value), margin + 10, y + 23);

    doc.setTextColor(...(kpi.change >= 0 ? COLORS.cyan : [239, 68, 68]));
    doc.text(`${kpi.change >= 0 ? '+' : ''}${kpi.change}%`, pageWidth - margin - 10, y + 23, { align: 'right' });

    y += 36;
  });

  // Growth Opportunities
  const growthInsights = insights.filter(i => i.type === 'opportunity' || i.type === 'driver');
  if (growthInsights.length > 0) {
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Growth Opportunities', margin, y);
    y += 10;

    growthInsights.slice(0, 2).forEach((insight) => {
      doc.setFillColor(...COLORS.gray100);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setTextColor(...COLORS.navy);
      doc.text(insight.title, margin + 10, y + 16);

      y += 30;
    });
  }

  const fileName = `NexoraAI_InvestorReport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  console.log('Investor Report PDF saved:', fileName);
}
