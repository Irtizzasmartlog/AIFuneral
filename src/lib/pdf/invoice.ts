import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const DISCLAIMER = "Director review required. This is not legal advice.";

export async function buildInvoicePdf(params: {
  invoiceNumber: string;
  caseNumber: string;
  deceasedName: string | null;
  clientName: string | null;
  clientEmail: string | null;
  organizationName: string;
  lineItems: { description: string; amountCents: number }[];
  totalCents: number;
  status: string;
  date: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, x: number, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) });
    y -= size + 2;
  };

  drawText(params.organizationName, 50, 18, true);
  drawText("INVOICE", 50, 14, true);
  drawText(`Invoice #${params.invoiceNumber}`, 50, 12);
  drawText(`Date: ${params.date}`, 50, 12);
  drawText(`Case: ${params.caseNumber}`, 50, 12);
  y -= 10;

  drawText(`Bill to: ${params.clientName ?? "N/A"}`, 50, 11);
  drawText(params.clientEmail ?? "", 50, 10);
  y -= 10;

  drawText("Description", 50, 10, true);
  page.drawText("Amount", { x: width - 120, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 14;

  for (const line of params.lineItems) {
    page.drawText(line.description, { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`$${(line.amountCents / 100).toFixed(2)}`, {
      x: width - 120,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 14;
  }

  y -= 8;
  page.drawText("Total", { x: 50, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`$${(params.totalCents / 100).toFixed(2)} AUD`, {
    x: width - 120,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 20;

  page.drawText(`Status: ${params.status}`, { x: 50, y, size: 10, font, color: rgb(0.1, 0.1, 0.1) });
  y -= 14;
  page.drawText("Payment instructions: Please contact your funeral director for payment details.", { x: 50, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
  y -= 14;
  page.drawText(DISCLAIMER, { x: 50, y, size: 8, font, color: rgb(0.4, 0.2, 0), maxWidth: width - 100 });

  const pdfBytes = await doc.save();
  return pdfBytes;
}
