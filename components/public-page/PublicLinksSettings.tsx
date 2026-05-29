"use client";

import { useI18n } from "@/components/I18nProvider";
import type { PublicPageLink, PublicPageLinkInput, PublicPageLinkType } from "@/lib/public-page/types";
import { cn } from "@/components/ui";
import { Trash, Plus } from "@/lib/icons";

const inputClass =
  "w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20";

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
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-white">
            {t("dashboard.settings.publicPage.publicLinks.enabled")}
          </span>
          <p className="mt-0.5 text-xs text-white/55">
            {t("dashboard.settings.publicPage.publicLinks.enabledHint")}
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
          className="h-5 w-5 rounded accent-[#2563EB]"
        />
      </label>

      {enabled && (
        <>
          {qrcodeOptions.length > 0 && (
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/60">
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
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        added
                          ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
                          : "border border-blue-400/40 bg-blue-500/15 text-blue-100 hover:bg-blue-500/25"
                      )}
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
              <p className="text-sm text-white/60">
                {t("dashboard.settings.publicPage.publicLinks.empty")}
              </p>
            ) : (
              links.map((link, index) => (
                <div
                  key={link.id || `new-${index}`}
                  className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white/60">
                      {t("dashboard.settings.publicPage.publicLinks.linkNumber", {
                        n: String(index + 1),
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveLink(index, -1)}
                        className="rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === links.length - 1}
                        onClick={() => moveLink(index, 1)}
                        className="rounded px-2 py-1 text-xs text-white/70 hover:bg-white/10 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="rounded p-1.5 text-rose-200 hover:bg-rose-500/20"
                        aria-label="Supprimer"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={link.isActive !== false}
                      onChange={(e) => updateLink(index, { isActive: e.target.checked })}
                      className="rounded accent-[#2563EB]"
                    />
                    {t("dashboard.settings.publicPage.publicLinks.active")}
                  </label>

                  <input
                    className={inputClass}
                    value={link.title}
                    onChange={(e) => updateLink(index, { title: e.target.value })}
                    placeholder={t("dashboard.settings.publicPage.publicLinks.titlePlaceholder")}
                  />
                  <input
                    className={inputClass}
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                    placeholder="https://... ou /inscription/..."
                  />
                  <input
                    className={inputClass}
                    value={link.description || ""}
                    onChange={(e) => updateLink(index, { description: e.target.value })}
                    placeholder={t("dashboard.settings.publicPage.publicLinks.descriptionPlaceholder")}
                  />
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={addManual}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.settings.publicPage.publicLinks.addManual")}
          </button>
        </>
      )}
    </div>
  );
}

export function linksToInputs(links: PublicPageLink[]): PublicPageLinkInput[] {
  return links.map((link, index) => toInput(link, index));
}
