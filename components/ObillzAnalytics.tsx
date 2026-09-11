"use client";

import { Analytics } from "@vercel/analytics/next";
import { redactAnalyticsEvent } from "@/lib/analytics/redactUrl";

export default function ObillzAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => redactAnalyticsEvent(event)}
    />
  );
}
