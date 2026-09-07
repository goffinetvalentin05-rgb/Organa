"use client";

import type { ReactNode } from "react";
import {
  cn,
  dashboardInnerPanelClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardTabActiveClass,
  dashboardTabInactiveClass,
} from "@/components/ui";
import VisualColorField from "@/components/visuals/VisualColorField";
import VisualImageField from "@/components/visuals/VisualImageField";
import {
  COLOR_FIELDS,
  CONTENT_FIELDS,
  IMAGE_FIELDS,
  LOGO_FIELDS,
  VISUAL_FORMAT_SIZE,
  type VisualClubContext,
  type VisualData,
  type VisualFieldKey,
  type VisualFormat,
} from "@/lib/visuals/types";
import type { VisualTemplateDefinition } from "@/lib/visuals/templates/registry";

type Props = {
  template: VisualTemplateDefinition;
  data: VisualData;
  format: VisualFormat;
  club: VisualClubContext | null;
  t: (key: string) => string;
  onChange: (patch: Partial<VisualData>) => void;
  onFormatChange: (format: VisualFormat) => void;
};

const TEXT_INPUTS: VisualFieldKey[] = [
  "title",
  "subtitle",
  "competition",
  "homeTeam",
  "awayTeam",
  "homeScore",
  "awayScore",
  "resultLabel",
  "date",
  "time",
  "venue",
  "extraText",
];

const IMAGE_SLOT: Partial<Record<VisualFieldKey, string>> = {
  clubLogoUrl: "clubLogo",
  opponentLogoUrl: "opponentLogo",
  eventLogoUrl: "eventLogo",
  playerImageUrl: "player",
  teamImageUrl: "team",
  backgroundImageUrl: "background",
  eventImageUrl: "event",
};

const IMAGE_FIT: Partial<
  Record<VisualFieldKey, keyof Pick<
    VisualData,
    "playerImageFit" | "teamImageFit" | "backgroundImageFit" | "eventImageFit"
  >>
> = {
  playerImageUrl: "playerImageFit",
  teamImageUrl: "teamImageFit",
  backgroundImageUrl: "backgroundImageFit",
  eventImageUrl: "eventImageFit",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cn(dashboardInnerPanelClass, "space-y-4 p-4 sm:p-5")}>
      <h3 className="text-sm font-semibold tracking-tight text-[#0F172A]">{title}</h3>
      {children}
    </section>
  );
}

export default function VisualConfigPanel({
  template,
  data,
  format,
  club,
  t,
  onChange,
  onFormatChange,
}: Props) {
  const enabled = new Set(template.editableFields);
  const show = (keys: VisualFieldKey[]) => keys.filter((key) => enabled.has(key));
  const content = show(CONTENT_FIELDS);
  const logos = show(LOGO_FIELDS);
  const images = show(IMAGE_FIELDS);
  const colors = show(COLOR_FIELDS);

  return (
    <div className="space-y-4">
      <Section title={t("dashboard.visuals.sections.format")}>
        <div className="flex flex-wrap gap-2">
          {template.formats.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onFormatChange(item)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold",
                item === format ? dashboardTabActiveClass : dashboardTabInactiveClass
              )}
            >
              {item === "story"
                ? t("dashboard.visuals.formatStory")
                : t("dashboard.visuals.formatSquare")}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#64748B]">{VISUAL_FORMAT_SIZE[format].label}</p>
      </Section>

      {content.length > 0 ? (
        <Section title={t("dashboard.visuals.sections.content")}>
          {content.map((key) =>
            TEXT_INPUTS.includes(key) ? (
              <div key={key}>
                <label className={dashboardLabelClass}>
                  {t(`dashboard.visuals.fields.${key}`)}
                </label>
                {key === "extraText" ? (
                  <textarea
                    value={String(data[key] ?? "")}
                    rows={3}
                    className={dashboardInputClass}
                    onChange={(e) => onChange({ [key]: e.target.value })}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(data[key] ?? "")}
                    className={dashboardInputClass}
                    onChange={(e) => onChange({ [key]: e.target.value })}
                  />
                )}
              </div>
            ) : null
          )}
        </Section>
      ) : null}

      {logos.length > 0 ? (
        <Section title={t("dashboard.visuals.sections.logos")}>
          {logos.map((key) => (
            <VisualImageField
              key={key}
              label={t(`dashboard.visuals.fields.${key}`)}
              value={data[key] as string | null}
              slot={IMAGE_SLOT[key] || "background"}
              onChange={(url) => onChange({ [key]: url })}
              changeLabel={t("dashboard.visuals.changeLogo")}
              positionLabel={t("dashboard.visuals.position")}
              zoomLabel={t("dashboard.visuals.zoom")}
              removeLabel={t("dashboard.visuals.removeImage")}
              uploadError={t("dashboard.visuals.uploadError")}
            />
          ))}
        </Section>
      ) : null}

      {images.length > 0 ? (
        <Section title={t("dashboard.visuals.sections.images")}>
          {images.map((key) => {
            const fitKey = IMAGE_FIT[key];
            return (
              <VisualImageField
                key={key}
                label={t(`dashboard.visuals.fields.${key}`)}
                value={data[key] as string | null}
                slot={IMAGE_SLOT[key] || "background"}
                onChange={(url) => onChange({ [key]: url })}
                fit={fitKey ? data[fitKey] : undefined}
                onFitChange={
                  fitKey ? (fit) => onChange({ [fitKey]: fit }) : undefined
                }
                changeLabel={t("dashboard.visuals.changePhoto")}
                positionLabel={t("dashboard.visuals.position")}
                zoomLabel={t("dashboard.visuals.zoom")}
                removeLabel={t("dashboard.visuals.removeImage")}
                uploadError={t("dashboard.visuals.uploadError")}
              />
            );
          })}
        </Section>
      ) : null}

      {colors.length > 0 ? (
        <Section title={t("dashboard.visuals.sections.colors")}>
          {colors.map((key) => (
            <VisualColorField
              key={key}
              label={t(`dashboard.visuals.fields.${key}`)}
              value={String(data[key])}
              clubColor={club?.primaryColor}
              onChange={(next) => onChange({ [key]: next })}
            />
          ))}
        </Section>
      ) : null}
    </div>
  );
}
