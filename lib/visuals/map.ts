import type { VisualCategory, VisualFormat, VisualRecord } from "./types";
import { sanitizeVisualData } from "./data";

type VisualRow = {
  id: string;
  club_id: string;
  template_id: string;
  type: VisualCategory;
  format: VisualFormat;
  title: string;
  data_json: unknown;
  created_at: string;
  updated_at: string;
};

export function mapVisualRow(row: VisualRow): VisualRecord {
  return {
    id: row.id,
    clubId: row.club_id,
    templateId: row.template_id,
    type: row.type,
    format: row.format,
    title: row.title,
    data: sanitizeVisualData(row.data_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
