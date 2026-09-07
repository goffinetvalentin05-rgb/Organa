import type { VisualRenderProps } from "../types";
import { contrastText, mixToward } from "../colors";
import {
  ArcBurst,
  CoverPhoto,
  GrainOverlay,
  LogoMark,
  isStory,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function ClubEventTemplate01({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const primary = data.primaryColor;
  const accent = data.accentColor;
  const secondary = data.secondaryColor;
  const paper = mixToward(secondary, "#FFFFFF", 0.92);
  const ink = contrastText(paper);
  const onPrimary = contrastText(primary);
  const padX = story ? 56 : 40;
  const padY = story ? 40 : 28;

  return (
    <div
      className={visualDisplayFont.className}
      style={{
        ...visualRootStyle(format),
        color: ink,
        background: paper,
        display: "flex",
        flexDirection: "column",
        padding: `${padY}px ${padX}px ${story ? 36 : 28}px`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.85  0 0 0 0 0.82  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />
      <GrainOverlay opacity={0.08} />

      <div style={{ position: "relative", zIndex: 1, marginBottom: story ? 20 : 12 }}>
        <LogoMark
          src={data.eventLogoUrl || data.clubLogoUrl}
          size={story ? 84 : 64}
          alt={data.title || "Club"}
          background="#FFFFFF"
          foreground="#0B1220"
          paddingRatio={0.14}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          marginBottom: story ? -48 : -28,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: story ? 80 : 48,
            width: story ? "58%" : "56%",
            background: primary,
            overflow: "hidden",
          }}
        >
          <ArcBurst color={accent} size={story ? 620 : 420} top={-50} left={-90} rotate={-18} />
          <ArcBurst
            color={mixToward(accent, "#FFFFFF", 0.15)}
            size={story ? 460 : 300}
            bottom={-80}
            right={-100}
            rotate={140}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: story ? 36 : 16,
            bottom: 0,
            width: story ? "68%" : "70%",
            background: "#111",
            boxShadow: "16px 20px 0 rgba(11,18,32,0.1)",
            transform: "rotate(2.4deg)",
            overflow: "hidden",
          }}
        >
          <CoverPhoto
            src={data.eventImageUrl}
            fit={data.eventImageFit}
            alt="Photo événement"
            fallback={`linear-gradient(145deg, ${mixToward(secondary, "#000000", 0.2)}, ${secondary})`}
          />
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
        <div
          style={{
            display: "inline-block",
            background: "#FFFFFF",
            border: `3px solid ${ink}`,
            color: ink,
            fontSize: story ? 22 : 16,
            fontWeight: 700,
            letterSpacing: "0.02em",
            padding: story ? "10px 16px" : "7px 12px",
            marginBottom: 8,
          }}
        >
          {data.subtitle || "Événement du club"}
        </div>

        <div
          style={{
            background: primary,
            color: onPrimary,
            padding: story ? "26px 28px 22px" : "16px 20px 14px",
          }}
        >
          <div
            style={{
              fontSize: story ? 58 : 38,
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            {data.title || "Soirée du club"}
          </div>
        </div>
        <div style={{ height: 8, background: accent }} />

        <div
          style={{
            background: mixToward(paper, "#FFFFFF", 0.35),
            borderTop: `4px solid ${ink}`,
            display: "grid",
            gridTemplateColumns: "1.2fr 12px 0.7fr 12px 1fr",
            alignItems: "stretch",
            padding: story ? "28px 8px 8px" : "18px 4px 4px",
            color: ink,
          }}
        >
          <InfoCol
            label="Date"
            value={data.date || "Date à confirmer"}
            story={story}
            size="lg"
          />
          <div style={{ background: ink, opacity: 0.85, margin: story ? "8px 0" : "4px 0" }} />
          <InfoCol label="Heure" value={data.time || "—"} story={story} />
          <div style={{ background: ink, opacity: 0.85, margin: story ? "8px 0" : "4px 0" }} />
          <InfoCol label="Lieu" value={data.venue || "Lieu à confirmer"} story={story} />
        </div>

        {data.extraText ? (
          <div
            style={{
              marginTop: story ? 18 : 12,
              fontSize: story ? 24 : 16,
              fontWeight: 500,
              lineHeight: 1.3,
              opacity: 0.78,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {data.extraText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InfoCol({
  label,
  value,
  story,
  size = "md",
}: {
  label: string;
  value: string;
  story: boolean;
  size?: "md" | "lg";
}) {
  return (
    <div style={{ minWidth: 0, padding: story ? "0 16px" : "0 10px" }}>
      <div
        style={{
          fontSize: story ? 16 : 12,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: story ? (size === "lg" ? 40 : 34) : size === "lg" ? 26 : 22,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {value}
      </div>
    </div>
  );
}
