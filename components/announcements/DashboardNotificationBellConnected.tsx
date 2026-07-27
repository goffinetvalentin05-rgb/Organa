"use client";

import NotificationBell from "@/components/DashboardNotificationBell";
import { useNewFeaturesAnnouncement } from "@/components/announcements/NewFeaturesAnnouncementProvider";

type DashboardNotificationBellConnectedProps = {
  variant?: "default" | "topbar";
};

export default function DashboardNotificationBellConnected({
  variant = "default",
}: DashboardNotificationBellConnectedProps) {
  const { notifications, handleNotificationClick } = useNewFeaturesAnnouncement();

  return (
    <NotificationBell
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      variant={variant}
    />
  );
}
