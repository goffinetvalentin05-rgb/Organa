"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { useI18n } from "@/components/I18nProvider";

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date?: string;
  read?: boolean;
};

type NotificationBellProps = {
  /** Notifications à afficher — vide par défaut (état UI prêt pour le backend). */
  notifications?: DashboardNotification[];
  onNotificationClick?: (id: string) => void;
  className?: string;
};

export default function NotificationBell({
  notifications = [],
  onNotificationClick,
  className,
}: NotificationBellProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("dashboard.topbar.notifications")}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/75 transition hover:border-blue-400/30 hover:bg-white/[0.12] hover:text-white"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A23FF] px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(26,35,255,0.6)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("dashboard.topbar.notifications")}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-blue-400/25 bg-gradient-to-br from-[#0a0f2e]/98 via-[#0d1238]/98 to-[#111827]/98 shadow-[0_0_0_1px_rgba(147,197,253,0.12),0_16px_48px_rgba(0,0,0,0.55),0_0_60px_rgba(26,35,255,0.2)] backdrop-blur-2xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">{t("dashboard.topbar.notifications")}</p>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
                <Bell className="h-5 w-5 text-blue-300/50" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-white/80">{t("dashboard.topbar.notificationsEmpty")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                {t("dashboard.topbar.notificationsEmptyHint")}
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-white/[0.06] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onNotificationClick?.(notification.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-white/[0.04]",
                      !notification.read && "bg-[#1A23FF]/[0.06]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1A23FF] shadow-[0_0_8px_rgba(26,35,255,0.8)]"
                          aria-hidden
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white/90">{notification.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-white/55">
                          {notification.message}
                        </p>
                        {notification.date ? (
                          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-white/35">
                            {notification.date}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
