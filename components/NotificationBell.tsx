"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

// ---------------------------------------------------------------------------
// In-app notification bell (PRD §25): polls periodically (MVP real-time
// approach per PRD §59), marks read, shows unread badge.
// ---------------------------------------------------------------------------

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success) {
        setItems(json.data.notifications);
        setUnread(json.data.unreadCount);
      }
    } catch {
      // silent — polling will retry
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20_000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-500"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-stone-200">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-bold text-stone-900">Notifications</h2>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto" role="list">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-stone-400">
                No notifications yet.
              </li>
            )}
            {items.map((n) => (
              <li
                key={n.id}
                className={`border-b border-stone-50 px-4 py-3 last:border-0 ${
                  n.read ? "" : "bg-green-50/60"
                }`}
              >
                <p className="text-sm font-semibold text-stone-800">{n.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{n.message}</p>
                <p className="mt-1 text-[11px] text-stone-400">
                  {new Date(n.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
