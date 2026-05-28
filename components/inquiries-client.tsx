"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { EmailComposeDialog } from "./email-compose-dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Calendar,
  Hash,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import type {
  ContactInquiryRecord,
  InquiryStatus,
} from "../lib/repositories/adminRepository";
import { RefreshButton } from "./refresh-button";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_review: "In Review",
  reviewed: "Reviewed",
  closed: "Closed",
};

const STATUS_PILL: Record<InquiryStatus, string> = {
  new: "bg-slate-950 text-white",
  in_review: "bg-blue-100 text-blue-700",
  reviewed: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-500",
};

const REASON_LABELS: Record<string, string> = {
  complaint: "Complaint",
  suggestion: "Suggestion",
  feedback: "Feedback",
  query: "General Query",
  support: "Product Support",
  partnership: "Partnership",
};

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

interface Filters {
  search: string;
  status: string;
  reason: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  rows: ContactInquiryRecord[];
  total: number;
  offset: number;
  limit: number;
  filters: Filters;
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy email"
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function InquiriesClient({
  rows,
  total,
  offset,
  limit,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<ContactInquiryRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editStatus, setEditStatus] = useState<InquiryStatus | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ search: value, offset: "0" });
    }, 400);
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasFilters = Object.values(filters).some(Boolean);

  function navigate(overrides: Partial<Filters & { offset: string }>) {
    const merged = {
      ...filters,
      search: searchInput,
      offset: String(offset),
      ...overrides,
    };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  function openDetail(inq: ContactInquiryRecord) {
    setSelected(inq);
    setEditStatus(inq.status);
    setEditNotes(inq.admin_notes ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setShowDetail(true);
  }

  async function handleSave() {
    if (!selected || !editStatus) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/inquiries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, admin_notes: editNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to update.");
      setSelected({
        ...selected,
        status: editStatus as InquiryStatus,
        admin_notes: editNotes,
      });
      setSaveSuccess(true);
      startTransition(() => router.refresh());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    editStatus !== selected?.status ||
    editNotes !== (selected?.admin_notes ?? "");

  // ── List panel ──────────────────────────────────────────────────────────────
  const ListPanel = () => (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {isPending ? (
        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="space-y-2.5 px-5 py-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-16 text-center">
          <MessageSquare className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">No inquiries found.</p>
          {hasFilters && (
            <button
              onClick={() =>
                navigate({
                  search: "",
                  status: "",
                  reason: "",
                  dateFrom: "",
                  dateTo: "",
                  offset: "0",
                })
              }
              className="mt-1 text-xs text-slate-950 underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {rows.map((inq) => {
            const isSelected = selected?.id === inq.id;
            return (
              <li key={inq.id}>
                <button
                  onClick={() => openDetail(inq)}
                  className={[
                    "w-full border-l-2 px-5 py-4 text-left transition-all",
                    isSelected
                      ? "border-l-slate-950 bg-slate-50"
                      : "border-l-transparent hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_PILL[inq.status]}`}
                        >
                          {STATUS_LABELS[inq.status]}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          {REASON_LABELS[inq.reason] ?? inq.reason}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-slate-950">
                        {inq.subject}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {inq.sender_name ? `${inq.sender_name} · ` : ""}
                        {inq.sender_email}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-slate-400">
                      {formatDate(inq.created_at)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

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
  );

  // ── Detail panel ────────────────────────────────────────────────────────────
  const DetailPanel = () => (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <MessageSquare className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              No inquiry selected
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Click an inquiry from the list to review it.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100">
          {/* Header */}
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[selected.status]}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
                {REASON_LABELS[selected.reason] ?? selected.reason}
              </span>
            </div>
            <p className="text-base font-semibold leading-snug text-slate-950">
              {selected.subject}
            </p>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <a
                  href={`mailto:${selected.sender_email}`}
                  className="font-medium text-slate-800 underline-offset-4 hover:underline"
                >
                  {selected.sender_email}
                </a>
                <CopyEmailButton email={selected.sender_email} />
              </div>
              <div className="pt-1">
                <EmailComposeDialog
                  kind="reply"
                  triggerLabel="Reply to sender"
                  title="Reply to inquiry"
                  description="Send a formatted HTML reply to the inquiry sender."
                  source="inquiries"
                  initialTo={selected.sender_email}
                  initialSubject={
                    selected.subject.startsWith("Re:")
                      ? selected.subject
                      : `Re: ${selected.subject}`
                  }
                  recipientName={selected.sender_name || undefined}
                  relatedId={selected.id}
                  relatedSubject={selected.subject}
                  triggerClassName="h-8 rounded-lg border-slate-200 bg-white text-xs"
                  buttonSize="sm"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {formatDate(selected.created_at)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span className="font-mono truncate">{selected.id}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Message
            </p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {selected.message}
            </p>
          </div>

          {/* Update */}
          <div className="space-y-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Update
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">
                Status
              </Label>
              <select
                value={editStatus}
                onChange={(e) => {
                  setEditStatus(e.target.value as InquiryStatus);
                  setSaveSuccess(false);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-600">
                Admin notes{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Textarea
                value={editNotes}
                onChange={(e) => {
                  setEditNotes(e.target.value);
                  setSaveSuccess(false);
                }}
                placeholder="Internal notes…"
                rows={3}
                className="resize-none rounded-lg border-slate-200 text-sm"
              />
            </div>

            {saveError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Changes saved.
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="h-9 w-full rounded-lg bg-slate-950 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Inquiries
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Contact form submissions — {total} total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EmailComposeDialog
            kind="compose"
            triggerLabel="Compose email"
            title="Compose email"
            description="Send a new responsive HTML email from the Spendly admin panel."
            source="inquiries"
            triggerClassName="h-9 rounded-lg border-slate-200 bg-white text-sm"
            buttonSize="sm"
          />
          <RefreshButton />
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search ID, email, subject…"
            className="h-9 rounded-lg border-slate-200 pl-9 text-sm"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => navigate({ status: e.target.value, offset: "0" })}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select
          value={filters.reason}
          onChange={(e) => navigate({ reason: e.target.value, offset: "0" })}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
        >
          <option value="">All reasons</option>
          {Object.entries(REASON_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              navigate({ dateFrom: e.target.value, offset: "0" })
            }
            title="From date"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => navigate({ dateTo: e.target.value, offset: "0" })}
            title="To date"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
          />
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                search: "",
                status: "",
                reason: "",
                dateFrom: "",
                dateTo: "",
                offset: "0",
              })
            }
            className="h-9 rounded-lg border-slate-200 px-3 text-sm"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Mobile: list or detail ── */}
      <div className="lg:hidden">
        {showDetail && selected ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowDetail(false)}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to list
            </button>
            <DetailPanel />
          </div>
        ) : (
          <ListPanel />
        )}
      </div>

      {/* ── Desktop: side-by-side ── */}
      <div className="hidden min-h-0 flex-1 gap-4 lg:grid lg:grid-cols-[1fr_400px] lg:items-stretch">
        <ListPanel />
        <DetailPanel />
      </div>
    </div>
  );
}
