type SummaryItem = {
  label: string;
  value: string;
};

type OutgoingEmailTemplateParams = {
  appName: string;
  headline: string;
  lead: string;
  recipientName?: string;
  intro: string;
  summaryItems?: SummaryItem[];
  messageTitle?: string;
  message: string;
  closingNote?: string;
  footerNote: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderParagraphs(value: string) {
  return value
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split(/\n/)
        .map((line) => escapeHtml(line))
        .join("<br />");
      return `<p style="margin:0 0 14px;">${lines}</p>`;
    })
    .join("");
}

function renderSummaryItems(items: SummaryItem[]) {
  if (items.length === 0) return "";

  return items
    .map(
      (item) => `
        <tr>
          <td class="summary-label" style="width:140px; padding:14px 16px; border-top:1px solid #e4e4e7; font-size:12px; line-height:1.4; letter-spacing:0.08em; text-transform:uppercase; color:#52525b; vertical-align:top;">${escapeHtml(item.label)}</td>
          <td class="summary-value" style="padding:14px 16px; border-top:1px solid #e4e4e7; font-size:14px; line-height:1.7; font-weight:600; color:#111111; word-break:break-word; overflow-wrap:anywhere; vertical-align:top;">${escapeHtml(item.value)}</td>
        </tr>`,
    )
    .join("");
}

export function buildOutgoingEmailHtml(params: OutgoingEmailTemplateParams) {
  const messageHtml = renderParagraphs(params.message);
  const summaryRows = renderSummaryItems(params.summaryItems ?? []);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(params.headline)} - ${escapeHtml(params.appName)}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background: #f7f7f7;
        color: #111111;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -webkit-text-size-adjust: 100%;
      }

      a {
        color: #111111;
      }

      .wrapper {
        width: 100%;
        padding: 32px 16px;
        box-sizing: border-box;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #d4d4d8;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 28px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }

      .masthead {
        padding: 20px 28px;
        background: linear-gradient(to bottom, #ffffff, #fbfbfb);
        color: #111111;
        border-bottom: 1px solid #e4e4e7;
      }

      .brand {
        display: inline-block;
        padding: 6px 10px;
        background: #111111;
        color: #ffffff;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .section {
        padding: 32px 28px;
        border-bottom: 1px solid #e4e4e7;
      }

      h1 {
        margin: 0;
        font-size: 26px;
        line-height: 1.15;
        letter-spacing: -0.03em;
        font-weight: 700;
      }

      .lead {
        margin: 12px 0 0;
        font-size: 16px;
        line-height: 1.7;
        color: #3f3f46;
      }

      .copy p {
        margin: 0 0 16px;
        font-size: 15px;
        line-height: 1.75;
        color: #2f2f2f;
      }

      .panel {
        margin-top: 24px;
        border: 1px solid #e4e4e7;
        background: #fafafa;
        border-radius: 14px;
        overflow: hidden;
      }

      .panel-heading {
        margin: 0;
        padding: 16px 16px 0;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #52525b;
      }

      .message-box {
        margin-top: 24px;
        border: 1px solid #e4e4e7;
        background: #ffffff;
        border-radius: 14px;
        overflow: hidden;
      }

      .message-header {
        padding: 16px 16px 0;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #52525b;
      }

      .message-body {
        padding: 10px 16px 16px;
        font-size: 14px;
        line-height: 1.75;
        color: #2f2f2f;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .note {
        margin-top: 24px;
        padding: 16px;
        border: 1px solid #e4e4e7;
        background: #fafafa;
        border-radius: 14px;
      }

      .note-title {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .note-text {
        margin: 0;
        font-size: 13px;
        line-height: 1.7;
        color: #3f3f46;
      }

      .footer {
        padding: 20px 28px;
        font-size: 12px;
        line-height: 1.6;
        background: #fafafa;
        color: #52525b;
        border-top: 1px solid #e4e4e7;
      }

      .footer-brand {
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #111111;
      }

      @media only screen and (max-width: 600px) {
        .wrapper {
          padding: 16px 10px;
        }

        .section,
        .footer,
        .masthead {
          padding-left: 18px;
          padding-right: 18px;
        }

        h1 {
          font-size: 24px;
        }

        .summary-label,
        .summary-value {
          display: block !important;
          width: auto !important;
        }

        .summary-label {
          padding-bottom: 6px !important;
          border-top: 1px solid #e4e4e7 !important;
          border-right: 0 !important;
        }

        .summary-value {
          padding-top: 0 !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <div class="masthead">
          <div class="brand">${escapeHtml(params.appName)}</div>
        </div>

        <div class="section">
          <h1>${escapeHtml(params.headline)}</h1>
          <p class="lead">${escapeHtml(params.lead)}</p>
        </div>

        <div class="section copy">
          ${params.recipientName ? `<p>Hi ${escapeHtml(params.recipientName)},</p>` : ""}
          <p>${escapeHtml(params.intro)}</p>

          ${summaryRows ? `<table class="panel" role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${summaryRows}</table>` : ""}

          <div class="message-box">
            <div class="message-header">${escapeHtml(params.messageTitle ?? "Message")}</div>
            <div class="message-body">${messageHtml}</div>
          </div>

          ${params.closingNote ? `<div class="note"><p class="note-title">Next step</p><p class="note-text">${escapeHtml(params.closingNote)}</p></div>` : ""}
        </div>

        <div class="footer">
          <div class="footer-brand">${escapeHtml(params.appName)}</div>
          <div>${escapeHtml(params.footerNote)}</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function buildOutgoingEmailText(params: OutgoingEmailTemplateParams) {
  const lines: string[] = [];

  lines.push(`${params.appName} — ${params.headline}`);
  lines.push("");
  if (params.recipientName) {
    lines.push(`Hi ${params.recipientName},`);
    lines.push("");
  }
  lines.push(params.lead);
  lines.push("");
  lines.push(params.intro);

  if (params.summaryItems && params.summaryItems.length > 0) {
    lines.push("");
    params.summaryItems.forEach((item) => {
      lines.push(`${item.label}: ${item.value}`);
    });
  }

  lines.push("");
  lines.push(params.messageTitle ?? "Message");
  lines.push(params.message);

  if (params.closingNote) {
    lines.push("");
    lines.push(params.closingNote);
  }

  lines.push("");
  lines.push(params.footerNote);

  return lines.join("\n");
}
