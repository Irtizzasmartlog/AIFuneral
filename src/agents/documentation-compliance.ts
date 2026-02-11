import type { CaseInput, DocumentationComplianceOutput } from "./types";

const DISCLAIMER =
  "This is not legal advice. Director review required. All documents must be verified for compliance before use.";

export function runDocumentationComplianceAgent(_caseData: CaseInput): DocumentationComplianceOutput {
  const documentChecklist = [
    { name: "Death certificate (original or certified copy)", linkPlaceholder: "[Upload link]", directorReviewRequired: true },
    { name: "Application for cremation or burial permit (as applicable)", linkPlaceholder: "[Form link]", directorReviewRequired: true },
    { name: "Authority to release (next of kin)", linkPlaceholder: "[Form link]", directorReviewRequired: true },
    { name: "Funeral arrangement agreement", linkPlaceholder: "[Form link]", directorReviewRequired: true },
    { name: "Payment and pricing disclosure", linkPlaceholder: "[Document link]", directorReviewRequired: true },
  ];

  return {
    documentChecklist,
    disclaimer: DISCLAIMER,
  };
}
