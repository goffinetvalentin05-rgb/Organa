"use client";

import type { ComponentType } from "react";
import { VISUAL_TEMPLATE_CATALOG } from "../catalog";
import type { VisualRenderProps, VisualTemplateMeta } from "../types";
import { ClubEventTemplate01 } from "./ClubEventTemplate01";
import { MatchPosterTemplate01 } from "./MatchPosterTemplate01";
import { MatchResultTemplate01 } from "./MatchResultTemplate01";

export type VisualTemplateDefinition = VisualTemplateMeta & {
  Render: ComponentType<VisualRenderProps>;
};

const RENDERERS: Record<string, ComponentType<VisualRenderProps>> = {
  "match-poster-01": MatchPosterTemplate01,
  "match-result-01": MatchResultTemplate01,
  "club-event-01": ClubEventTemplate01,
};

export const visualTemplates: VisualTemplateDefinition[] = VISUAL_TEMPLATE_CATALOG.map(
  (meta) => ({
    ...meta,
    Render: RENDERERS[meta.id],
  })
);

export function getVisualTemplate(id: string): VisualTemplateDefinition | undefined {
  return visualTemplates.find((item) => item.id === id);
}
