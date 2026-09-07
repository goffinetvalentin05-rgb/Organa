import type { VisualRenderProps } from "../types";
import { mixToward } from "../colors";
import {
  CoverPhoto,
  LogoMark,
  isStory,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function ClubEventTemplate01({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <CoverPhoto
        src={data.eventImageUrl}
        fit={data.eventImageFit}
        alt="Photo événement"
        fallback={`linear-gradient(200deg, ${mixToward(data.primaryColor, "#000000", 0.2)} 0%, ${data.secondaryColor} 70%)`}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 40%, ${data.secondaryColor} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: story ? "46%" : "42%",
          height: story ? "38%" : "44%",
          background: data.primaryColor,
          clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)",
          opacity: 0.92,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: story ? 36 : 28,
          right: story ? 36 : 28,
          width: story ? 18 : 14,
          height: story ? 160 : 110,
          background: data.accentColor,
        }}
      />

      <div style={{ position: "absolute", left: story ? 56 : 44, top: story ? 56 : 40 }}>
        <LogoMark
          src={data.eventLogoUrl || data.clubLogoUrl}
          size={story ? 112 : 88}
          alt={data.title || "Club"}
          ring="rgba(255,255,255,0.7)"
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 44,
          right: story ? 56 : 44,
          bottom: story ? 64 : 48,
          color: ink,
        }}
      >
        {data.subtitle ? (
          <div
            style={{
              fontSize: 20,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 18,
              opacity: 0.85,
            }}
          >
            {data.subtitle}
          </div>
        ) : null}
        <div
          style={{
            fontSize: story ? 92 : 68,
            lineHeight: 0.9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "-0.03em",
            maxWidth: "96%",
          }}
        >
          {data.title || "Événement du club"}
        </div>

        <div
          style={{
            marginTop: story ? 36 : 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Chip color={data.primaryColor} label={data.date || "Date à confirmer"} />
          <Chip color="rgba(255,255,255,0.12)" label={data.time || "—"} />
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: story ? 32 : 26,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {data.venue || "Lieu à confirmer"}
        </div>
        {data.extraText ? (
          <div
            style={{
              marginTop: 16,
              fontSize: 22,
              fontWeight: 400,
              maxWidth: 760,
              opacity: 0.82,
              lineHeight: 1.35,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            {data.extraText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        background: color,
        padding: "12px 18px",
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}
