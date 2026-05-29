"use client";

import { useI18n } from "@/components/I18nProvider";
import type { PublicPageLink, PublicPageLinkInput, PublicPageLinkType } from "@/lib/public-page/types";
import { cn } from "@/components/ui";
import { Trash, Plus } from "@/lib/icons";
import {
  ppCheckboxClass,
  ppDashedButtonClass,
  ppDisabledBlockClass,
  ppHintClass,
  ppInputClass,
  ppLinkCardClass,
  ppPanelClass,
  ppQrcodeChipAddedClass,
  ppQrcodeChipClass,
  ppToggleHintClass,
  ppToggleRowClass,
  ppToggleTitleClass,
} from "./settings-styles";

function toInput(link: PublicPageLink, index: number): PublicPageLinkInput {
  return {
    id: link.id,
    title: link.title,
    description: link.description,
    url: link.url,
    type: link.type,
    qrcodeId: link.qrcodeId,
    isActive: link.isActive,
    sortOrder: index,
  };
}

export default function PublicLinksSettings({
  enabled,
  onEnabledChange,
  links,
  onLinksChange,
  qrcodeOptions,
}: {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  links: PublicPageLinkInput[];
  onLinksChange: (links: PublicPageLinkInput[]) => void;
  qrcodeOptions: { id: string; name: string; registrationPath: string }[];
}) {
  const { t } = useI18n();

  const addManual = () => {
    onLinksChange([
      ...links,
      {
        title: "",
        url: "",
        type: "custom",
        isActive: true,
        sortOrder: links.length,
      },
    ]);
  };

  const addFromQrcode = (option: { id: string; name: string; registrationPath: string }) => {
    if (links.some((l) => l.qrcodeId === option.id)) return;
    onLinksChange([
      ...links,
      {
        title: option.name,
        url: option.registrationPath,
        type: "qr_code",
        qrcodeId: option.id,
        isActive: true,
        sortOrder: links.length,
      },
    ]);
  };

  const updateLink = (index: number, patch: Partial<PublicPageLinkInput>) => {
    onLinksChange(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLink = (index: number) => {
    onLinksChange(
      links.filter((_, i) => i !== index).map((l, i) => ({ ...l, sortOrder: i }))
    );
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onLinksChange(next.map((l, i) => ({ ...l, sortOrder: i })));
  };

  const existingQrcodeIds = new Set(links.map((l) => l.qrcodeId).filter(Boolean));

  return (
    <div className="space-y-4">
      <label className={ppToggleRowClass}>
        <div>
          <span className={ppToggleTitleClass}>
            {t("dashboard.settings.publicPage.publicLinks.enabled")}
          </span>
          <p className={ppToggleHintClass}>
            {t("dashboard.settings.publicPage.publicLinks.enabledHint")}
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className={ppCheckboxClass}
        />
      </label>

      <div className={cn(!enabled && ppDisabledBlockClass)}>
        {enabled ? (
          <>
            {qrcodeOptions.length > 0 && (
              <div className={ppPanelClass}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("dashboard.settings.publicPage.publicLinks.fromQrcodes")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {qrcodeOptions.map((option) => {
                    const added = existingQrcodeIds.has(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={added}
                        onClick={() => addFromQrcode(option)}
                        className={added ? ppQrcodeChipAddedClass : ppQrcodeChipClass}
                      >
                        + {option.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {links.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {t("dashboard.settings.publicPage.publicLinks.empty")}
                </p>
              ) : (
                links.map((link, index) => (
                  <div key={link.id || `new-${index}`} className={ppLinkCardClass}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        {t("dashboard.settings.publicPage.publicLinks.linkNumber", {
                          n: String(index + 1),
                        })}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveLink(index, -1)}
                          className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={index === links.length - 1}
                          onClick={() => moveLink(index, 1)}
                          className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                          aria-label="Supprimer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={link.isActive !== false}
                        onChange={(e) => updateLink(index, { isActive: e.target.checked })}
                        className={ppCheckboxClass}
                      />
                      {t("dashboard.settings.publicPage.publicLinks.active")}
                    </label>

                    <input
                      className={ppInputClass}
                      value={link.title}
                      onChange={(e) => updateLink(index, { title: e.target.value })}
                      placeholder={t("dashboard.settings.publicPage.publicLinks.titlePlaceholder")}
                    />
                    <input
                      className={ppInputClass}
                      value={link.url}
                      onChange={(e) => updateLink(index, { url: e.target.value })}
                      placeholder="https://... ou /inscription/..."
                    />
                    <input
                      className={ppInputClass}
                      value={link.description || ""}
                      onChange={(e) => updateLink(index, { description: e.target.value })}
                      placeholder={t(
                        "dashboard.settings.publicPage.publicLinks.descriptionPlaceholder"
                      )}
                    />
                  </div>
                ))
              )}
            </div>

            <button type="button" onClick={addManual} className={ppDashedButtonClass}>
              <Plus className="h-4 w-4" />
              {t("dashboard.settings.publicPage.publicLinks.addManual")}
            </button>
          </>
        ) : (
          <p className={ppHintClass}>
            {t("dashboard.settings.publicPage.publicLinks.disabledHint")}
          </p>
        )}
      </div>
    </div>
  );
}

export function linksToInputs(links: PublicPageLink[]): PublicPageLinkInput[] {
  return links.map((link, index) => toInput(link, index));
}
