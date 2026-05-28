"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { CheckCircle2, Send, X } from "lucide-react";

type EmailKind = "compose" | "reply";

interface EmailComposeDialogProps {
  kind: EmailKind;
  triggerLabel: string;
  title: string;
  description: string;
  source: "inbox" | "inquiries";
  initialTo?: string;
  initialSubject?: string;
  recipientName?: string;
  relatedId?: string;
  relatedSubject?: string;
  triggerClassName?: string;
  buttonSize?: "sm" | "default";
  buttonVariant?: "default" | "outline";
  onOpenChange?: (open: boolean) => void;
}

export function EmailComposeDialog({
  kind,
  triggerLabel,
  title,
  description,
  source,
  initialTo = "",
  initialSubject = "",
  recipientName,
  relatedId,
  relatedSubject,
  triggerClassName = "",
  buttonSize = "sm",
  buttonVariant = "outline",
  onOpenChange,
}: EmailComposeDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(initialTo);
    setSubject(initialSubject);
    setMessage("");
    setError(null);
    setSuccess(false);
  }, [open, initialTo, initialSubject]);

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          to_name: recipientName,
          subject,
          message,
          kind,
          source,
          related_id: relatedId,
          related_subject: relatedSubject,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Failed to send email.");
      }

      setSuccess(true);
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setDialogOpen(true)}
        className={triggerClassName}
      >
        <Send className="mr-1.5 h-3.5 w-3.5" />
        {triggerLabel}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  {title}
                </p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {success ? (
                <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-950">
                      Email sent successfully
                    </p>
                    <p className="text-sm text-slate-500">
                      Your {kind === "reply" ? "reply" : "email"} was delivered.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">
                      To
                    </Label>
                    <Input
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="name@example.com"
                      className="h-10 rounded-lg border-slate-200 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">
                      Subject
                    </Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="h-10 rounded-lg border-slate-200 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-600">
                      Message
                    </Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message…"
                      rows={10}
                      className="min-h-48 resize-y rounded-lg border-slate-200 text-sm leading-6"
                    />
                    <p className="text-xs text-slate-400">
                      This message will be rendered as a responsive HTML email.
                    </p>
                  </div>

                  {kind === "reply" && relatedSubject && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      Replying to:{" "}
                      <span className="font-medium text-slate-700">
                        {relatedSubject}
                      </span>
                    </div>
                  )}

                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {success ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-lg border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSend}
                    disabled={sending || !to || !subject || !message}
                    className="rounded-lg bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {sending ? "Sending…" : triggerLabel}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
