"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmailComposeDialog } from "./email-compose-dialog";
import {
  Search,
  Mail,
  MailOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { InboundEmailRecord } from "../lib/repositories/adminRepository";
import { RefreshButton } from "./refresh-button";

interface Props {
  rows: InboundEmailRecord[];
  total: number;
  unreadCount: number;
  offset: number;
  limit: number;
  search: string;
  isReadFilter: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />
  );
}

export function InboxClient({
  rows,
  total,
  unreadCount,
  offset,
  limit,
  search,
  isReadFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<InboundEmailRecord | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(search);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  useEffect(() => {
    if (searchTerm === search) return;

    const timeout = window.setTimeout(() => {
      navigate({ search: searchTerm, offset: "0" });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, search, isReadFilter, offset]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({
      ...(search && { search }),
      ...(isReadFilter && { isRead: isReadFilter }),
      offset: String(offset),
    });
    Object.entries(params).forEach(([k, v]) => {
      if (v === "") sp.delete(k);
      else sp.set(k, v);
    });
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  async function handleMarkRead(email: InboundEmailRecord) {
    if (email.is_read) {
      setSelected(email);
      return;
    }
    setMarkingRead(email.id);
    await fetch(`/api/inbox/${email.id}/read`, { method: "POST" });
    setMarkingRead(null);
    setSelected({ ...email, is_read: true });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Inbox
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Emails received at support@spendly.software via Resend webhook.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EmailComposeDialog
            kind="compose"
            triggerLabel="Compose email"
            title="Compose email"
            description="Send a new responsive HTML email from the Spendly admin panel."
            source="inbox"
            triggerClassName="h-9 rounded-lg border-slate-200 bg-white text-sm"
            buttonSize="sm"
          />
          {unreadCount > 0 && (
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {unreadCount} unread
            </span>
          )}
          <RefreshButton />
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            placeholder="Search sender or subject…"
            className="h-9 rounded-lg border-slate-200 pl-9 text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={isReadFilter}
          onChange={(e) => navigate({ isRead: e.target.value, offset: "0" })}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950 sm:w-auto"
        >
          <option value="">All emails</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_420px] lg:items-stretch">
        {/* ── Email list panel ── */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isPending ? (
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-4">
                  <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-20 shrink-0" />
                </li>
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
              <MailOpen className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">No emails found.</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {rows.map((email) => {
                const isSelected = selected?.id === email.id;
                const isUnread = !email.is_read;
                return (
                  <li key={email.id}>
                    <button
                      onClick={() => handleMarkRead(email)}
                      disabled={markingRead === email.id}
                      className={[
                        "group w-full border-l-2 px-5 py-4 text-left transition-all disabled:opacity-60",
                        isSelected
                          ? "border-l-slate-950 bg-slate-100/80"
                          : isUnread
                            ? "border-l-blue-500 bg-linear-to-r from-blue-50/90 to-white hover:bg-blue-50"
                            : "border-l-transparent bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          {/* Icon */}
                          <div className="mt-0.5 shrink-0">
                            {markingRead === email.id ? (
                              <span className="flex h-4 w-4 items-center justify-center">
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                              </span>
                            ) : isUnread ? (
                              <Mail className="h-4 w-4 text-slate-950" />
                            ) : (
                              <MailOpen className="h-4 w-4 text-slate-500" />
                            )}
                          </div>

                          {/* Text */}
                          <div className="min-w-0">
                            <p
                              className={`truncate text-sm ${
                                isUnread
                                  ? "font-semibold text-slate-950"
                                  : "text-slate-700"
                              }`}
                            >
                              {email.from_address}
                            </p>
                            <p
                              className={`mt-0.5 truncate text-sm ${
                                isUnread ? "text-slate-800" : "text-slate-600"
                              }`}
                            >
                              {email.subject}
                            </p>
                            {email.text_body && (
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {email.text_body.slice(0, 100)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right side */}
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <p className="text-xs text-slate-500">
                            {formatDate(email.created_at)}
                          </p>
                          {!email.is_read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]" />
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset === 0 || isPending}
                  onClick={() =>
                    navigate({ offset: String(Math.max(0, offset - limit)) })
                  }
                  className="h-8 w-8 rounded-lg border-slate-200 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-xs text-slate-600">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= total || isPending}
                  onClick={() => navigate({ offset: String(offset + limit) })}
                  className="h-8 w-8 rounded-lg border-slate-200 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Email detail panel ── */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  No email selected
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Click an email from the list to read it.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100">
              {/* Meta section */}
              <div className="space-y-3 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-base font-semibold leading-snug text-slate-950">
                    {selected.subject}
                  </p>
                  <div className="flex items-center gap-2">
                    <EmailComposeDialog
                      kind="reply"
                      triggerLabel="Reply"
                      title="Reply to email"
                      description="Send a formatted HTML reply to the selected email address."
                      source="inbox"
                      initialTo={selected.from_address}
                      initialSubject={
                        selected.subject.startsWith("Re:")
                          ? selected.subject
                          : `Re: ${selected.subject}`
                      }
                      relatedId={selected.id}
                      relatedSubject={selected.subject}
                      triggerClassName="h-8 rounded-lg border-slate-200 bg-white text-xs"
                      buttonSize="sm"
                    />
                    {!selected.is_read && (
                      <Badge className="shrink-0 border-slate-200 bg-slate-50 text-xs text-slate-600">
                        Unread
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5 text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium text-slate-400">
                      From
                    </span>
                    <a
                      href={`mailto:${selected.from_address}`}
                      className="truncate text-slate-800 underline-offset-4 hover:underline"
                    >
                      {selected.from_address}
                    </a>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium text-slate-400">
                      To
                    </span>
                    <span className="truncate text-slate-600">
                      {selected.to_address}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="w-8 shrink-0 text-xs font-medium text-slate-400">
                      Date
                    </span>
                    <span className="text-slate-500 text-xs">
                      {formatDate(selected.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body section */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Message
                </p>
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selected.text_body ?? selected.html_body ?? "(No body)"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
