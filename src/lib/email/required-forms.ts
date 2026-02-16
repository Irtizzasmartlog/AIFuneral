/**
 * Default list of required forms sent to the client.
 * TODO: Replace placeholder links with real document URLs (S3, DB, or local paths)
 * when documents are stored. Resend supports attachments via resend.emails.send({ attachments: [...] }).
 */
export const REQUIRED_FORMS_LIST = [
  "Client Details / Next of Kin form",
  "Funeral Service Arrangement form",
  "Death Registration details checklist",
  "Cemetery/Crematorium authority form",
  "Funeral Notice approval form",
  "Payment authorisation / invoice acknowledgement",
  "Cultural/religious requirements checklist (optional)",
] as const;

export type RequiredFormName = (typeof REQUIRED_FORMS_LIST)[number];

/** Placeholder base URL for form links. Replace with actual document URLs when available. */
const PLACEHOLDER_BASE = "#";

/**
 * Build HTML body for the required-forms email.
 * Uses placeholder links; replace with real URLs when documents are stored.
 */
export function buildRequiredFormsEmailHtml(params: {
  deceasedName: string | null;
  caseNumber: string;
  formNames: readonly string[];
}): string {
  const { deceasedName, caseNumber, formNames } = params;
  const name = deceasedName ?? "your loved one";
  const formItems = formNames
    .map(
      (label, i) =>
        `<li style="margin: 8px 0;"><a href="${PLACEHOLDER_BASE}form-${i + 1}" style="color: #2563eb;">${label}</a></li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Required forms</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #334155; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Dear family,</p>
  <p>Please find below the documents and forms required for the arrangements for ${name} (Case ${caseNumber}).</p>
  <p><strong>Documents included:</strong></p>
  <ul style="list-style: none; padding-left: 0;">
    ${formItems}
  </ul>
  <p><em>Please complete and return the forms as instructed. If you have any questions, contact your funeral director.</em></p>
  <p style="margin-top: 32px; font-size: 12px; color: #64748b;">This is an automated message from FuneralFlow AI.</p>
</body>
</html>`;
}
