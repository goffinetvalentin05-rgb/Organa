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
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(147,197,253,0.2)] bg-[rgba(255,255,255,0.06)] text-[#A8B8D0] transition hover:border-[rgba(96,165,250,0.4)] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#93C5FD]"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#1A23FF] to-[#2563EB] px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(26,35,255,0.5)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("dashboard.topbar.notifications")}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-[1.35rem] border border-[rgba(147,197,253,0.18)] bg-[#0F2744] shadow-[0_20px_48px_rgba(2,6,23,0.5)] backdrop-blur-xl"
        >
          <div className="border-b border-[rgba(147,197,253,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3.5">
            <p className="text-sm font-semibold text-[#F8FAFC]">{t("dashboard.topbar.notifications")}</p>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(26,35,255,0.2)] ring-1 ring-[rgba(147,197,253,0.2)]">
                <Bell className="h-5 w-5 text-[#93C5FD]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-[#E2E8F0]">{t("dashboard.topbar.notificationsEmpty")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#A8B8D0]">
                {t("dashboard.topbar.notificationsEmptyHint")}
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-[rgba(147,197,253,0.1)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onNotificationClick?.(notification.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-[rgba(255,255,255,0.05)]",
                      !notification.read && "bg-[rgba(26,35,255,0.12)]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                          aria-hidden
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#F8FAFC]">{notification.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#A8B8D0]">
                          {notification.message}
                        </p>
                        {notification.date ? (
                          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-[#7B91B0]">
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
