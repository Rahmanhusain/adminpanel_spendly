import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { extractAdminAuthContext } from "../../../../lib/middleware/adminAuth";
import {
  buildOutgoingEmailHtml,
  buildOutgoingEmailText,
} from "../../../../lib/email/templates";
import { upsertInboundEmail } from "../../../../lib/repositories/adminRepository";

const sendSchema = z.object({
  to: z.string().email(),
  to_name: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10000),
  kind: z.enum(["compose", "reply"]),
  source: z.enum(["inbox", "inquiries"]),
  related_id: z.string().uuid().optional(),
  related_subject: z.string().trim().max(200).optional(),
});

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

if (!resendApiKey || !resendFromEmail) {
  throw new Error(
    "Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variables.",
  );
}

const resend = new Resend(resendApiKey);
const resendFromEmailAddress = resendFromEmail!;

function isEmailLike(value?: string) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatAddress(name: string | undefined, email: string) {
  if (!name || isEmailLike(name)) return email;
  return `${name} <${email}>`;
}

function formatSender(email: string) {
  return email;
}

export async function POST(request: Request) {
  const ctx = await extractAdminAuthContext(request);
  if (!ctx) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = sendSchema.parse(body);

  const html = buildOutgoingEmailHtml({
    appName: "Spendly",
    headline:
      parsed.kind === "reply" ? "Reply from Spendly" : "Message from Spendly",
    lead:
      parsed.kind === "reply"
        ? "Our support team has replied to your message."
        : "You have received a new message from the Spendly admin team.",
    recipientName: undefined,
    intro:
      parsed.kind === "reply"
        ? "Thank you for reaching out. Please find our response below."
        : "Please find the details of our message below.",
    summaryItems: [
      { label: "To", value: formatAddress(parsed.to_name, parsed.to) },
      { label: "Subject", value: parsed.subject },
      { label: "From", value: formatSender(resendFromEmailAddress) },
    ],
    messageTitle: parsed.kind === "reply" ? "Reply" : "Compose message",
    message: parsed.message,
    closingNote:
      parsed.kind === "reply"
        ? "If you need anything else, reply to this email and we will continue the conversation."
        : "If you need any follow-up, reply to this message and we will respond promptly.",
    footerNote:
      "This email was sent from the Spendly admin panel. Please do not reply to this address directly.",
  });

  const text = buildOutgoingEmailText({
    appName: "Spendly",
    headline:
      parsed.kind === "reply" ? "Reply from Spendly" : "Message from Spendly",
    lead:
      parsed.kind === "reply"
        ? "Our support team has replied to your message."
        : "You have received a new message from the Spendly admin team.",
    recipientName: undefined,
    intro:
      parsed.kind === "reply"
        ? "Thank you for reaching out. Please find our response below."
        : "Please find the details of our message below.",
    summaryItems: [
      { label: "To", value: formatAddress(parsed.to_name, parsed.to) },
      { label: "Subject", value: parsed.subject },
      { label: "From", value: formatSender(resendFromEmailAddress) },
    ],
    messageTitle: parsed.kind === "reply" ? "Reply" : "Compose message",
    message: parsed.message,
    closingNote:
      parsed.kind === "reply"
        ? "If you need anything else, reply to this email and we will continue the conversation."
        : "If you need any follow-up, reply to this message and we will respond promptly.",
    footerNote:
      "This email was sent from the Spendly admin panel. Please do not reply to this address directly.",
  });

  const result = await resend.emails.send({
    from: resendFromEmailAddress,
    to: parsed.to,
    subject: parsed.subject,
    html,
    text,
    replyTo: resendFromEmailAddress,
  });

  await upsertInboundEmail({
    resend_email_id:
      typeof result.data?.id === "string" ? result.data.id : undefined,
    direction: "outbound",
    from_address: resendFromEmailAddress,
    to_address: parsed.to,
    subject: parsed.subject,
    text_body: parsed.message,
    html_body: html,
    raw_payload: {
      kind: parsed.kind,
      source: parsed.source,
      related_id: parsed.related_id ?? null,
      related_subject: parsed.related_subject ?? null,
      sent_by_admin_id: ctx.adminId,
      sent_by_admin_name: ctx.name,
      sent_by_admin_email: ctx.email,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      id: result.data?.id ?? null,
    },
    { status: 200 },
  );
}
