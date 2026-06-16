"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { DashboardNotification } from "@/components/DashboardNotificationBell";
import {
  NEW_FEATURES_2026_06_KEY,
  NEW_FEATURES_ANNOUNCEMENT_DATE,
  NEW_FEATURES_NOTIFICATION_ID,
} from "@/lib/announcements/constants";
import NewFeaturesAnnouncementModal from "./NewFeaturesAnnouncementModal";

type NewFeaturesAnnouncementContextValue = {
  notifications: DashboardNotification[];
  handleNotificationClick: (id: string) => void;
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

export function NewFeaturesAnnouncementProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [seen, setSeen] = useState(true);
  const [checked, setChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(
          `/api/feature-announcements?key=${encodeURIComponent(NEW_FEATURES_2026_06_KEY)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setSeen(Boolean(data.seen));
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

  useEffect(() => {
    if (checked && !seen && pathname === "/tableau-de-bord") {
      setModalOpen(true);
    }
  }, [checked, seen, pathname]);

  const markSeen = useCallback(async () => {
    try {
      await fetch("/api/feature-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: NEW_FEATURES_2026_06_KEY }),
      });
    } catch {
      /* ignore */
    }
    setSeen(true);
    setModalOpen(false);
  }, []);

  const handleNotificationClick = useCallback(
    (id: string) => {
      if (id === NEW_FEATURES_NOTIFICATION_ID && !seen) {
        void markSeen();
      }
    },
    [seen, markSeen]
  );

  const notifications = useMemo(
    (): DashboardNotification[] => [
      {
        id: NEW_FEATURES_NOTIFICATION_ID,
        title: "Nouveautés disponibles",
        message:
          "Import de membres par Excel/CSV et création de PV de séances sont maintenant disponibles.",
        date: NEW_FEATURES_ANNOUNCEMENT_DATE,
        read: seen,
      },
    ],
    [seen]
  );

  const value = useMemo(
    () => ({ notifications, handleNotificationClick }),
    [notifications, handleNotificationClick]
  );

  return (
    <NewFeaturesAnnouncementContext.Provider value={value}>
      {children}
      {modalOpen ? (
        <NewFeaturesAnnouncementModal onDismiss={() => void markSeen()} onDiscover={() => void markSeen()} />
      ) : null}
    </NewFeaturesAnnouncementContext.Provider>
  );
}
