"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { DashboardNotification } from "@/components/DashboardNotificationBell";
import { useI18n } from "@/components/I18nProvider";
import {
  BELL_NOTIFICATION_DEFS,
  FEATURE_ANNOUNCEMENT_TRACKING_KEYS,
  NEW_FEATURES_2026_06_KEY,
  PRODUCT_NOTIFICATION_DEFS,
  RELEASE_BUNDLE_TOAST_2026_09,
} from "@/lib/announcements/constants";
import NewFeaturesAnnouncementModal from "./NewFeaturesAnnouncementModal";
import ProductReleaseToast from "./ProductReleaseToast";

type NewFeaturesAnnouncementContextValue = {
  notifications: DashboardNotification[];
  handleNotificationClick: (id: string) => void;
  markAllRead: () => void;
  openRequestTick: number;
  requestOpenPanel: () => void;
  dismissReleaseToast: () => void;
};

const NewFeaturesAnnouncementContext = createContext<NewFeaturesAnnouncementContextValue | null>(
  null
);

export function useNewFeaturesAnnouncement() {
  const ctx = useContext(NewFeaturesAnnouncementContext);
  if (!ctx) {
    throw new Error("useNewFeaturesAnnouncement must be used within NewFeaturesAnnouncementProvider");
  }
  return ctx;
}

const defaultSeenMap = (): Record<string, boolean> =>
  Object.fromEntries(FEATURE_ANNOUNCEMENT_TRACKING_KEYS.map((key) => [key, true]));

export function NewFeaturesAnnouncementProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [seenByKey, setSeenByKey] = useState<Record<string, boolean>>(defaultSeenMap);
  const [checked, setChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [openRequestTick, setOpenRequestTick] = useState(0);
  const toastMarkedRef = useRef(false);
  const seenRef = useRef(seenByKey);
  seenRef.current = seenByKey;
  const existingUserForToastRef = useRef(false);

  const persistKeys = useCallback(async (keys: string[]) => {
    if (keys.length === 0) return;
    try {
      await fetch("/api/feature-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys.length === 1 ? { key: keys[0] } : { keys }),
      });
    } catch {
      /* ignore */
    }
  }, []);

  const markKeysSeen = useCallback(
    (keys: string[]) => {
      const unique = keys.filter((key) => seenRef.current[key] === false);
      if (unique.length === 0) return;
      const next = { ...seenRef.current };
      for (const key of unique) next[key] = true;
      seenRef.current = next;
      setSeenByKey(next);
      void persistKeys(unique);
    },
    [persistKeys]
  );

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const params = new URLSearchParams({
          keys: FEATURE_ANNOUNCEMENT_TRACKING_KEYS.join(","),
        });
        const res = await fetch(`/api/feature-announcements?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const seen = data?.seen;
        if (!cancelled && seen && typeof seen === "object" && !Array.isArray(seen)) {
          setSeenByKey((prev) => {
            const next = { ...prev };
            for (const [key, value] of Object.entries(seen as Record<string, unknown>)) {
              if (typeof value === "boolean") next[key] = value;
            }
            existingUserForToastRef.current = next[NEW_FEATURES_2026_06_KEY] !== false;
            seenRef.current = next;
            return next;
          });
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setChecked(true);
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const juneSeen = seenByKey[NEW_FEATURES_2026_06_KEY] !== false;
  const productUnread = PRODUCT_NOTIFICATION_DEFS.some((def) => seenByKey[def.id] === false);
  const toastSeen = seenByKey[RELEASE_BUNDLE_TOAST_2026_09] !== false;

  useEffect(() => {
    if (checked && !juneSeen && pathname === "/tableau-de-bord") {
      setModalOpen(true);
    }
  }, [checked, juneSeen, pathname]);

  useEffect(() => {
    if (
      !checked ||
      toastSeen ||
      !productUnread ||
      modalOpen ||
      !existingUserForToastRef.current ||
      toastMarkedRef.current
    ) {
      return;
    }
    toastMarkedRef.current = true;
    setToastOpen(true);
    markKeysSeen([RELEASE_BUNDLE_TOAST_2026_09]);
  }, [checked, toastSeen, productUnread, modalOpen, markKeysSeen]);

  const markJuneSeen = useCallback(() => {
    markKeysSeen([NEW_FEATURES_2026_06_KEY]);
    setModalOpen(false);
  }, [markKeysSeen]);

  const handleNotificationClick = useCallback(
    (id: string) => {
      markKeysSeen([id]);
    },
    [markKeysSeen]
  );

  const markAllRead = useCallback(() => {
    markKeysSeen(BELL_NOTIFICATION_DEFS.map((def) => def.id));
  }, [markKeysSeen]);

  const requestOpenPanel = useCallback(() => {
    setToastOpen(false);
    setOpenRequestTick((tick) => tick + 1);
  }, []);

  const dismissReleaseToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  const notifications = useMemo(
    (): DashboardNotification[] =>
      BELL_NOTIFICATION_DEFS.map((def) => ({
        id: def.id,
        title: t(def.titleKey),
        message: t(def.messageKey),
        cta: t(def.ctaKey),
        date: t(def.dateKey),
        href: def.href,
        icon: def.icon,
        read: seenByKey[def.id] !== false,
      })),
    [seenByKey, t]
  );

  const value = useMemo(
    () => ({
      notifications,
      handleNotificationClick,
      markAllRead,
      openRequestTick,
      requestOpenPanel,
      dismissReleaseToast,
    }),
    [notifications, handleNotificationClick, markAllRead, openRequestTick, requestOpenPanel, dismissReleaseToast]
  );

  return (
    <NewFeaturesAnnouncementContext.Provider value={value}>
      {children}
      {modalOpen ? (
        <NewFeaturesAnnouncementModal
          onDismiss={() => markJuneSeen()}
          onDiscover={() => markJuneSeen()}
        />
      ) : null}
      <ProductReleaseToast
        open={toastOpen}
        title={t("dashboard.notifications.toast.title")}
        message={t("dashboard.notifications.toast.message")}
        cta={t("dashboard.notifications.toast.cta")}
        closeLabel={t("dashboard.notifications.toast.close")}
        onCta={() => {
          setToastOpen(false);
          requestOpenPanel();
        }}
        onDismiss={() => setToastOpen(false)}
      />
    </NewFeaturesAnnouncementContext.Provider>
  );
}
