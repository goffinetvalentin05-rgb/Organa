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
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#E7EBF3] bg-white text-[#667085] transition hover:border-blue-200 hover:bg-blue-50/50 hover:text-[#2563EB]"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1A23FF] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("dashboard.topbar.notifications")}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-[#E7EBF3] bg-white shadow-[0_12px_32px_rgba(16,24,40,0.12),0_2px_8px_rgba(16,24,40,0.06)]"
        >
          <div className="border-b border-[#EEF2F7] px-4 py-3">
            <p className="text-sm font-semibold text-[#10172A]">{t("dashboard.topbar.notifications")}</p>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2F5FA] ring-1 ring-[#E7EBF3]">
                <Bell className="h-5 w-5 text-[#98A2B3]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-[#344054]">{t("dashboard.topbar.notificationsEmpty")}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#98A2B3]">
                {t("dashboard.topbar.notificationsEmptyHint")}
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-[#EEF2F7] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onNotificationClick?.(notification.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition hover:bg-[#F6F8FC]",
                      !notification.read && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1A23FF]"
                          aria-hidden
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#10172A]">{notification.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-[#667085]">
                          {notification.message}
                        </p>
                        {notification.date ? (
                          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-[#98A2B3]">
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
