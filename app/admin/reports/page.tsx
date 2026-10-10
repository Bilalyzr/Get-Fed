"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/Toast";

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  metadata: unknown;
  actor: { name: string; organisation: string; role: string };
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditEntry[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        if (json.success) {
          setAuditLogs(json.data.auditLogs);
        }
      } catch {
        toast("error", "Could not load reports.");
      }
    })();
  }, [toast]);

  function downloadCsv() {
    if (!auditLogs) return;
    const header = "timestamp,action,entity_type,entity_id,actor,organisation\n";
    const rows = auditLogs
      .map((log) => {
        const ts = new Date(log.createdAt).toISOString();
        const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
        return [
          ts,
          esc(log.action),
          esc(log.entityType),
          esc(log.entityId ?? ""),
          esc(log.actor.name),
          esc(log.actor.organisation),
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `get-fed-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("success", "Audit report downloaded.");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">Reports & audit trail</h1>
        <p className="text-sm text-stone-500">
          Every critical action is traceable (PRD §60). Export for judging documentation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-5">
          <span className="rounded-xl bg-green-100 p-2.5 text-green-700" aria-hidden>
            <FileBarChart className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-stone-900">Audit log export</p>
            <p className="text-xs text-stone-500">
              {auditLogs?.length ?? 0} recent events · CSV format
            </p>
          </div>
          <button onClick={downloadCsv} disabled={!auditLogs?.length} className="btn-primary !px-3 !py-2 text-xs">
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="rounded-xl bg-sky-100 p-2.5 text-sky-700" aria-hidden>
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-stone-900">Traceability guarantee</p>
            <p className="text-xs text-stone-500">
              Listing creation, claims, cancellations, collections, expiry and
              verification events are all recorded with actor + metadata.
            </p>
          </div>
        </div>
      </div>

      <section aria-labelledby="audit-log-title">
        <h2 id="audit-log-title" className="mb-3 text-lg font-bold text-stone-900">
          Recent audit events
        </h2>
        {!auditLogs ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-14" />
            ))}
          </div>
        ) : (
          <ul className="card divide-y divide-stone-100" role="list">
            {auditLogs.map((log) => (
              <li key={log.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-stone-900">
                    {log.action.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <p className="text-xs text-stone-400">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {log.actor.name} ({log.actor.organisation}) · {log.entityType}
                  {log.entityId ? ` · ${log.entityId.slice(0, 12)}…` : ""}
                </p>
                {log.metadata != null && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-50 p-2 text-[11px] text-stone-600">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
