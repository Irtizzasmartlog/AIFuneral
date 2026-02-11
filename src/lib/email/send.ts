import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<{ provider: "resend" | "mock"; externalId?: string }> {
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: params.from ?? "FuneralFlow AI <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message);
    }
    return { provider: "resend", externalId: data?.id };
  }
  console.log("[Mock email]", { to: params.to, subject: params.subject, bodyPreview: params.html.slice(0, 200) });
  return { provider: "mock" };
}
