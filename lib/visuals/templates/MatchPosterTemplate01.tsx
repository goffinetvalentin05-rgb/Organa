import type { VisualRenderProps } from "../types";
import { contrastText, mixToward } from "../colors";
import {
  CoverPhoto,
  LogoMark,
  isStory,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function MatchPosterTemplate01({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";
  const onPrimary = contrastText(data.primaryColor);
  const split = story ? "42%" : "46%";

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <CoverPhoto
        src={data.playerImageUrl}
        fit={data.playerImageFit}
        alt="Photo joueur"
        fallback={`linear-gradient(145deg, ${mixToward(data.primaryColor, "#000000", 0.35)} 0%, ${data.secondaryColor} 100%)`}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${data.secondaryColor} 0%, ${data.secondaryColor} ${split}, transparent 78%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: split,
          background: data.primaryColor,
          clipPath: story
            ? "polygon(0 0, 88% 0, 100% 100%, 0 100%)"
            : "polygon(0 0, 82% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: story ? "38%" : "40%",
          top: 0,
          bottom: 0,
          width: 18,
          background: data.accentColor,
          transform: "skewX(-8deg)",
          opacity: 0.95,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 48,
          top: story ? 72 : 48,
          right: story ? 420 : 360,
          color: onPrimary,
        }}
      >
        <div
          style={{
            fontSize: story ? 22 : 18,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            fontWeight: 600,
            opacity: 0.85,
          }}
        >
          {data.competition || "Championnat"}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: story ? 34 : 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          {data.title || "Prochain match"}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 48,
          top: story ? 280 : 180,
          width: story ? 430 : 460,
          color: onPrimary,
        }}
      >
        <div
          style={{
            fontSize: story ? 86 : 64,
            lineHeight: 0.9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
          }}
        >
          {data.homeTeam || "Domicile"}
        </div>
        <div
          style={{
            marginTop: story ? 28 : 16,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 86,
            height: 86,
            borderRadius: 18,
            background: data.secondaryColor,
            color: ink,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          VS
        </div>
        <div
          style={{
            marginTop: story ? 28 : 16,
            fontSize: story ? 64 : 48,
            lineHeight: 0.92,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "-0.02em",
            opacity: 0.92,
          }}
        >
          {data.awayTeam || "Extérieur"}
        </div>
      </div>

      <div style={{ position: "absolute", right: story ? 64 : 48, top: story ? 64 : 40 }}>
        <LogoMark src={data.opponentLogoUrl} size={story ? 108 : 88} alt={data.awayTeam || "EXT"} />
      </div>

      <div style={{ position: "absolute", left: story ? 56 : 48, bottom: story ? 210 : 150 }}>
        <LogoMark
          src={data.clubLogoUrl}
          size={story ? 132 : 104}
          alt={data.homeTeam || "DOM"}
          ring={data.accentColor}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: story ? "36px 56px 48px" : "28px 48px 36px",
          background: `linear-gradient(180deg, transparent, ${data.secondaryColor} 38%)`,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          color: ink,
        }}
      >
        <MetaBlock label="Date" value={data.date || "À confirmer"} />
        <MetaBlock label="Heure" value={data.time || "—"} />
        <MetaBlock label="Lieu" value={data.venue || "—"} wide />
      </div>
    </div>
  );
}

function MetaBlock({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div style={{ minWidth: 0, flex: wide ? 1.4 : 1 }}>
      <div
        style={{
          fontSize: 14,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          opacity: 0.62,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: wide ? 28 : 32,
          fontWeight: 600,
          lineHeight: 1.1,
          textTransform: "uppercase",
        }}
      >
        {value}
      </div>
    </div>
  );
}
