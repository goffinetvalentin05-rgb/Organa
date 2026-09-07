"use client";

import { useCallback } from "react";
import NotificationBell from "@/components/DashboardNotificationBell";
import { useNewFeaturesAnnouncement } from "@/components/announcements/NewFeaturesAnnouncementProvider";

type DashboardNotificationBellConnectedProps = {
  variant?: "default" | "topbar";
};

export default function DashboardNotificationBellConnected({
  variant = "default",
}: DashboardNotificationBellConnectedProps) {
  const { notifications, handleNotificationClick, markAllRead, openRequestTick, dismissReleaseToast } =
    useNewFeaturesAnnouncement();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) dismissReleaseToast();
    },
    [dismissReleaseToast]
  );

  return (
    <NotificationBell
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onMarkAllRead={markAllRead}
      onOpenChange={handleOpenChange}
      openRequestTick={openRequestTick}
      variant={variant}
    />
  );
}
