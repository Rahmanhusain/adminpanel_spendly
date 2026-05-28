"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Users,
  Copy,
  Check,
} from "lucide-react";
import type { TenantWithStats } from "../lib/repositories/adminRepository";
import { RefreshButton } from "./refresh-button";

const STATUS_PILL: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  suspended: "bg-amber-100 text-amber-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />
  );
}

function CopyIdButton({ value, title }: { value: string; title: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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

interface Props {
  rows: TenantWithStats[];
  total: number;
  offset: number;
  limit: number;
  search: string;
  statusFilter: string;
}

export function AccountsClient({
  rows,
  total,
  offset,
  limit,
  search,
  statusFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ search: value, offset: "0" });
    }, 400);
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({
      ...(searchInput && { search: searchInput }),
      ...(statusFilter && { status: statusFilter }),
      offset: String(offset),
      ...params,
    });
    [...sp.keys()].forEach((k) => {
      if (!sp.get(k)) sp.delete(k);
    });
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            All tenant workspaces — {total} total.
          </p>
        </div>
        <RefreshButton />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search workspace name, slug, or id…"
            className="h-9 rounded-lg border-slate-200 pl-9 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => navigate({ status: e.target.value, offset: "0" })}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── List card ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isPending ? (
          <ul className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
              </li>
            ))}
          </ul>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Building2 className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-500">No workspaces found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((tenant) => (
              <li key={tenant.id} className="flex items-center gap-2 px-5 py-4">
                <Link
                  href={`/accounts/${tenant.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4 transition-colors hover:bg-slate-50"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                    <Building2 className="h-4 w-4 text-slate-500" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {tenant.name}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_PILL[tenant.status] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {tenant.status}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium capitalize text-slate-600">
                        {tenant.plan}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono">{tenant.slug}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono">{tenant.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tenant.active_user_count}/{tenant.user_count} users
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{formatDate(tenant.created_at)}</span>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
                <CopyIdButton value={tenant.id} title="Copy workspace ID" />
              </li>
            ))}
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
    </div>
  );
}
