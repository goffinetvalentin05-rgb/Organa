import type { VisualRenderProps } from "../types";
import { contrastText, mixToward } from "../colors";
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
  const onAccent = contrastText(accent);
  const [line1, line2] = splitDisplayTitle(data.title || "Prochain match", "MATCH");
  const home = data.homeTeam || "Domicile";
  const away = data.awayTeam || "Extérieur";
  const bannerH = story ? 210 : 168;
  const logoSize = story ? 118 : 92;
  const photoTop = story ? 310 : 230;

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
      <HalftoneCorner color={mixToward(accent, "#FFFFFF", 0.1)} size={story ? 360 : 240} bottom={bannerH - 20} right={-30} />
      <DiagonalStripes
        color={accent}
        width={story ? 130 : 90}
        right={0}
        top={photoTop + 40}
        height={story ? 780 : 420}
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
          bottom: bannerH,
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
            background: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 28%, rgba(0,0,0,0.35) 100%)`,
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
            fontSize: story ? 132 : 86,
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
            fontSize: story ? 92 : 62,
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
          height: bannerH,
          background: accent,
          color: onAccent,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: story ? "0 36px" : "0 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: story ? 22 : 16,
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
              fontSize: story ? 42 : 30,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 0.9,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {home}
          </div>
          <div
            style={{
              fontSize: story ? 28 : 20,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "0.04em",
              opacity: 0.7,
              flexShrink: 0,
            }}
          >
            vs
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: story ? 42 : 30,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              lineHeight: 0.9,
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
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
            marginTop: story ? 12 : 8,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            fontSize: story ? 18 : 14,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            opacity: 0.72,
          }}
        >
          <span>{data.date || "Date à confirmer"}</span>
          <span>·</span>
          <span>{data.time || "—"}</span>
          <span>·</span>
          <span
            style={{
              maxWidth: 360,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.venue || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
