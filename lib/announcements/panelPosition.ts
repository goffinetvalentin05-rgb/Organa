export const NOTIFICATION_PANEL_WIDTH_PX = 392;
export const NOTIFICATION_PANEL_VIEWPORT_GUTTER_PX = 12;
export const NOTIFICATION_PANEL_GAP_PX = 8;
export const NOTIFICATION_PANEL_MOBILE_BREAKPOINT_PX = 640;

export type NotificationPanelPlacement = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  mobile: boolean;
};

export function placeNotificationPanel(input: {
  trigger: { top: number; right: number; bottom: number; left: number };
  viewportWidth: number;
  viewportHeight: number;
}): NotificationPanelPlacement {
  const gutter = NOTIFICATION_PANEL_VIEWPORT_GUTTER_PX;
  const gap = NOTIFICATION_PANEL_GAP_PX;
  const mobile = input.viewportWidth < NOTIFICATION_PANEL_MOBILE_BREAKPOINT_PX;
  const top = Math.max(gutter, input.trigger.bottom + gap);
  const maxHeight = Math.max(180, input.viewportHeight - top - gutter);

  if (mobile) {
    return {
      mobile: true,
      top,
      left: gutter,
      width: Math.max(240, input.viewportWidth - gutter * 2),
      maxHeight,
    };
  }

  const width = Math.min(
    NOTIFICATION_PANEL_WIDTH_PX,
    Math.max(280, input.viewportWidth - gutter * 2)
  );
  const left = Math.min(
    Math.max(gutter, input.trigger.right - width),
    Math.max(gutter, input.viewportWidth - width - gutter)
  );

  return { mobile: false, top, left, width, maxHeight };
}
