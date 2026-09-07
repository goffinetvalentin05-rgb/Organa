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
  const logoSize = story ? 168 : 120;
  const photoTop = story ? 280 : 200;
  const nameSize = story ? 42 : 28;

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
            background: `linear-gradient(180deg, rgba(0,0,0,0.04) 0%, transparent 28%, ${fade} 58%, ${mixToward(primary, "#000000", 0.78)} 100%)`,
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
          left: story ? 48 : 36,
          right: story ? 48 : 36,
          bottom: story ? 88 : 48,
          color: ink,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "start",
            columnGap: story ? 20 : 14,
          }}
        >
          <ClubStack
            src={data.clubLogoUrl}
            name={home}
            logoSize={logoSize}
            nameSize={nameSize}
          />
          <div
            style={{
              alignSelf: "center",
              fontSize: story ? 34 : 24,
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "0.06em",
              opacity: 0.8,
              paddingTop: story ? 52 : 36,
            }}
          >
            vs
          </div>
          <ClubStack
            src={data.opponentLogoUrl}
            name={away}
            logoSize={logoSize}
            nameSize={nameSize}
          />
        </div>

        <div
          style={{
            margin: story ? "28px auto 0" : "18px auto 0",
            width: story ? 120 : 88,
            height: 4,
            background: accent,
          }}
        />

        <div
          style={{
            marginTop: story ? 22 : 14,
            fontSize: story ? 42 : 28,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          {data.date || "Date à confirmer"}
        </div>
        <div
          style={{
            marginTop: story ? 10 : 6,
            fontSize: story ? 64 : 42,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            textTransform: "uppercase",
            lineHeight: 1,
            color: accent,
          }}
        >
          {data.time || "—"}
        </div>
        <div
          style={{
            marginTop: story ? 12 : 8,
            fontSize: story ? 32 : 22,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            lineHeight: 1.15,
            opacity: 0.92,
          }}
        >
          {data.venue || "—"}
        </div>
      </div>
    </div>
  );
}

function ClubStack({
  src,
  name,
  logoSize,
  nameSize,
}: {
  src: string | null;
  name: string;
  logoSize: number;
  nameSize: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 0,
        gap: 12,
      }}
    >
      <LogoMark
        src={src}
        size={logoSize}
        alt={name}
        background="rgba(255,255,255,0.96)"
        foreground="#0B1220"
        paddingRatio={0.14}
      />
      <div
        style={{
          fontSize: nameSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          lineHeight: 1.05,
          maxWidth: "100%",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {name}
      </div>
    </div>
  );
}
