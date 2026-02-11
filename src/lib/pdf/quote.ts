import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PackageWithLines = {
  name: string;
  tier: string;
  totalCents: number;
  lineItems: { description: string; amountCents: number; category: string }[];
  assumptions: string;
};

export async function buildQuotePdf(params: {
  caseNumber: string;
  deceasedName: string | null;
  organizationName: string;
  packages: PackageWithLines[];
  disclaimer: string;
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
  drawText(`Quote: ${params.caseNumber}`, 50, 12);
  drawText(`Deceased: ${params.deceasedName ?? "N/A"}`, 50, 12);
  y -= 10;

  for (const pkg of params.packages) {
    drawText(`${pkg.name} (${pkg.tier})`, 50, 14, true);
    const totalAud = (pkg.totalCents / 100).toFixed(2);
    drawText(`Total: $${totalAud} AUD`, 50, 12);
    for (const line of pkg.lineItems) {
      page.drawText(`  ${line.description}: $${(line.amountCents / 100).toFixed(2)}`, {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 12;
    }
    if (pkg.assumptions) {
      page.drawText(`  Assumptions: ${pkg.assumptions}`, {
        x: 50,
        y,
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 10;
    }
    y -= 8;
  }

  y -= 10;
  page.drawText(params.disclaimer, {
    x: 50,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.2, 0),
    maxWidth: width - 100,
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
}
