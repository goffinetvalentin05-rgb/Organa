import type { VisualRenderProps } from "../types";
import { mixToward } from "../colors";
import {
  BrushStroke,
  CoverPhoto,
  DiagonalStripes,
  GrainOverlay,
  HalftoneCorner,
  LogoMark,
  TORN_PHOTO_CLIP,
  isStory,
  splitDisplayTitle,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function MatchPosterTemplate01({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";
  const primary = data.primaryColor;
  const accent = data.accentColor;
  const secondary = data.secondaryColor;
  const fade = mixToward(primary, "#000000", 0.45);
  const [line1, line2] = splitDisplayTitle(data.title || "Prochain match", "MATCH");
  const home = data.homeTeam || "Domicile";
  const away = data.awayTeam || "Extérieur";
  const footerH = story ? 340 : 250;
  const logoSize = story ? 156 : 118;
  const photoTop = story ? 300 : 220;
  const nameSize = story ? 56 : 38;
  const metaSize = story ? 28 : 20;

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${mixToward(primary, "#000000", 0.08)} 0%, ${primary} 42%, ${mixToward(primary, "#000000", 0.18)} 100%)`,
        }}
      />
      <HalftoneCorner color={mixToward(accent, "#FFFFFF", 0.15)} size={story ? 460 : 300} top={-40} left={-40} />
      <HalftoneCorner color={mixToward(accent, "#FFFFFF", 0.1)} size={story ? 360 : 240} bottom={80} right={-30} />
      <DiagonalStripes
        color={accent}
        width={story ? 130 : 90}
        right={0}
        top={photoTop + 40}
        height={story ? 900 : 520}
      />
      <BrushStroke
        color={accent}
        width={story ? 78 : 56}
        height={story ? 640 : 380}
        left={0}
        top={photoTop + 80}
      />
      <GrainOverlay opacity={0.1} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: photoTop,
          bottom: 0,
          overflow: "hidden",
          clipPath: TORN_PHOTO_CLIP,
        }}
      >
        <CoverPhoto
          src={data.playerImageUrl}
          fit={data.playerImageFit}
          alt="Photo joueur"
          fallback={`linear-gradient(160deg, ${mixToward(secondary, "#000000", 0.1)}, ${secondary})`}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 32%, ${fade} 78%, ${mixToward(primary, "#000000", 0.72)} 100%)`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 44,
          right: story ? 56 : 44,
          top: story ? 52 : 36,
          color: ink,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: story ? 20 : 15,
            fontWeight: 700,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {(data.competition || home).toUpperCase()}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: story ? 124 : 80,
            fontWeight: 900,
            lineHeight: 0.78,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
          }}
        >
          {line1}
        </div>
        <div
          style={{
            marginTop: -4,
            fontSize: story ? 86 : 56,
            fontWeight: 800,
            lineHeight: 0.82,
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {line2}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: footerH,
          padding: story ? "48px 40px 44px" : "32px 28px 28px",
          color: ink,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: `linear-gradient(180deg, transparent 0%, ${mixToward(primary, "#000000", 0.15)} 28%, ${mixToward(primary, "#000000", 0.62)} 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: story ? 20 : 14,
          }}
        >
          <LogoMark
            src={data.clubLogoUrl}
            size={logoSize}
            alt={home}
            background="rgba(255,255,255,0.96)"
            foreground="#0B1220"
            paddingRatio={0.14}
          />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: nameSize,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 0.92,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {home}
          </div>
          <div
            style={{
              fontSize: story ? 36 : 26,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "0.02em",
              opacity: 0.78,
              flexShrink: 0,
              padding: story ? "0 6px" : "0 2px",
            }}
          >
            vs
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: nameSize,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 0.92,
              textAlign: "right",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {away}
          </div>
          <LogoMark
            src={data.opponentLogoUrl}
            size={logoSize}
            alt={away}
            background="rgba(255,255,255,0.96)"
            foreground="#0B1220"
            paddingRatio={0.14}
          />
        </div>

        <div
          style={{
            marginTop: story ? 22 : 14,
            height: 3,
            background: accent,
            opacity: 0.9,
          }}
        />

        <div
          style={{
            marginTop: story ? 16 : 12,
            display: "grid",
            gridTemplateColumns: "1.15fr 0.7fr 1fr",
            gap: story ? 18 : 12,
            fontSize: metaSize,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.15,
          }}
        >
          <span style={clamp2}>{data.date || "Date à confirmer"}</span>
          <span>{data.time || "—"}</span>
          <span style={{ ...clamp2, textAlign: "right" }}>{data.venue || "—"}</span>
        </div>
      </div>
    </div>
  );
}

const clamp2 = {
  minWidth: 0,
  overflow: "hidden" as const,
  display: "-webkit-box" as const,
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
};
