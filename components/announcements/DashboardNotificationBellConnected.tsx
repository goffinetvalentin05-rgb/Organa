"use client";

import NotificationBell from "@/components/DashboardNotificationBell";
import { useNewFeaturesAnnouncement } from "@/components/announcements/NewFeaturesAnnouncementProvider";

export default function DashboardNotificationBellConnected() {
  const { notifications, handleNotificationClick } = useNewFeaturesAnnouncement();

  return (
    <NotificationBell
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
    />
  );
}
