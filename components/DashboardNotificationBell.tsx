"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/components/ui/cn";
import BodyPortal from "@/components/ui/BodyPortal";
import { useI18n } from "@/components/I18nProvider";
import { useDismissibleMenu } from "@/lib/ui/useDismissibleMenu";
import { placeNotificationPanel } from "@/lib/announcements/panelPosition";
import { CreditCard, FilePlus, ShoppingBag, Sparkles, Users } from "@/lib/icons";
import type { ProductNotificationIcon } from "@/lib/announcements/constants";

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  date?: string;
  read?: boolean;
  href?: string;
  cta?: string;
  icon?: ProductNotificationIcon;
};

type NotificationBellProps = {
  notifications?: DashboardNotification[];
  onNotificationClick?: (id: string) => void;
  onMarkAllRead?: () => void;
  onOpenChange?: (open: boolean) => void;
  openRequestTick?: number;
  className?: string;
  variant?: "default" | "topbar";
};

function NotificationGlyph({ icon }: { icon?: ProductNotificationIcon }) {
  const className = "h-4 w-4";
  if (icon === "credit-card") return <CreditCard className={className} />;
  if (icon === "shopping-bag") return <ShoppingBag className={className} />;
  if (icon === "sparkles") return <Sparkles className={className} />;
  if (icon === "users") return <Users className={className} />;
  return <FilePlus className={className} />;
}

export default function NotificationBell({
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  onOpenChange,
  openRequestTick = 0,
  className,
  variant = "default",
}: NotificationBellProps) {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDismissibleMenu(open, close, panelRef);
  const [placement, setPlacement] = useState<ReturnType<typeof placeNotificationPanel> | null>(
    null
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isTopbar = variant === "topbar";

  const updatePlacement = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPlacement(
      placeNotificationPanel({
        trigger: {
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left,
        },
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, updatePlacement]);

  useEffect(() => {
    if (openRequestTick > 0) setOpen(true);
  }, [openRequestTick]);

  useEffect(() => {
    if (open) onOpenChange?.(true);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const handleItemActivate = (id: string) => {
    onNotificationClick?.(id);
    close();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={t("dashboard.topbar.notifications")}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition",
          isTopbar
            ? "dashboard-topbar-control"
            : "border border-[rgba(15,23,42,0.1)] bg-white text-[#64748B] hover:border-[rgba(26,35,255,0.2)] hover:bg-[#F8FAFC] hover:text-[#1A23FF]"
        )}
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 ? (
          <span
            className={cn(
              "absolute right-0.5 top-0.5 flex items-center justify-center rounded-full bg-[#1A23FF]",
              isTopbar ? "ring-2 ring-[#071634]" : "ring-2 ring-white",
              unreadCount > 1
                ? "h-3.5 min-w-3.5 px-1 text-[9px] font-bold leading-none text-white"
                : "h-2 w-2"
            )}
            aria-label={t("dashboard.topbar.unreadCount", { count: unreadCount })}
          >
            {unreadCount > 1 ? (unreadCount > 9 ? "9+" : unreadCount) : null}
          </span>
        ) : null}
      </button>

      <BodyPortal open={open}>
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={t("dashboard.topbar.notifications")}
          tabIndex={-1}
          className="pointer-events-auto outline-none"
          style={{
            position: "fixed",
            top: placement?.top ?? 56,
            left: placement?.left ?? 12,
            width: placement?.width ?? 392,
            maxHeight: placement?.maxHeight ?? 480,
            zIndex: 10000,
          }}
        >
          <div
            className={cn(
              "flex max-h-[inherit] flex-col overflow-hidden rounded-[1.35rem] border border-[rgba(15,23,42,0.1)] bg-white",
              "shadow-[0_18px_50px_rgba(15,23,42,0.16),0_0_0_1px_rgba(26,35,255,0.04)]"
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[rgba(15,23,42,0.06)] bg-[#FAFBFD] px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {t("dashboard.topbar.notifications")}
                </p>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  {unreadCount > 0
                    ? t("dashboard.topbar.unreadHint", { count: unreadCount })
                    : t("dashboard.topbar.upToDate")}
                </p>
              </div>
              {unreadCount > 0 && onMarkAllRead ? (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-[#1A23FF] transition hover:bg-[rgba(26,35,255,0.08)]"
                >
                  {t("dashboard.topbar.markAllRead")}
                </button>
              ) : null}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(26,35,255,0.08)] ring-1 ring-[rgba(26,35,255,0.12)]">
                  <Bell className="h-5 w-5 text-[#1A23FF]" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-[#0F172A]">
                  {t("dashboard.topbar.notificationsEmpty")}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
                  {t("dashboard.topbar.notificationsEmptyHint")}
                </p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto py-1">
                {notifications.map((notification) => {
                  const unread = !notification.read;
                  const itemClass = cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                    "hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC] focus-visible:outline-none",
                    unread && "bg-[rgba(26,35,255,0.045)]"
                  );
                  const body = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                          unread
                            ? "bg-[rgba(26,35,255,0.1)] text-[#1A23FF] ring-[rgba(26,35,255,0.16)]"
                            : "bg-[#F8FAFC] text-[#64748B] ring-[rgba(15,23,42,0.08)]"
                        )}
                      >
                        <NotificationGlyph icon={notification.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm leading-snug text-[#0F172A]",
                              unread ? "font-semibold" : "font-medium text-[#334155]"
                            )}
                          >
                            {notification.title}
                          </span>
                          {unread ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1A23FF]" aria-hidden />
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-[#64748B]">
                          {notification.message}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          {unread ? (
                            <span className="inline-flex rounded-full bg-[rgba(26,35,255,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1A23FF]">
                              {t("dashboard.topbar.notificationNew")}
                            </span>
                          ) : null}
                          {notification.date ? (
                            <span className="text-[11px] font-medium text-[#94A3B8]">
                              {notification.date}
                            </span>
                          ) : null}
                          {notification.cta ? (
                            <span className="text-[11px] font-semibold text-[#1A23FF]">
                              {notification.cta}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <li
                      key={notification.id}
                      className="border-b border-[rgba(15,23,42,0.06)] last:border-b-0"
                    >
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          className={itemClass}
                          onClick={() => handleItemActivate(notification.id)}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={itemClass}
                          onClick={() => handleItemActivate(notification.id)}
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </BodyPortal>
    </div>
  );
}
