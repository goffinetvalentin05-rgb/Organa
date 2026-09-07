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
  const padX = story ? 64 : 48;
  const collageTop = story ? 210 : 150;
  const collageH = story ? 820 : 430;
  const photoW = story ? 620 : 560;
  const photoH = story ? 620 : 360;

  return (
    <div
      className={visualDisplayFont.className}
      style={{ ...visualRootStyle(format), color: ink, background: paper }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.55,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.85  0 0 0 0 0.82  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
          backgroundSize: "240px 240px",
        }}
      />
      <GrainOverlay opacity={0.08} />

      <div
        style={{
          position: "absolute",
          left: padX,
          top: story ? 48 : 36,
        }}
      >
        <LogoMark
          src={data.eventLogoUrl || data.clubLogoUrl}
          size={story ? 92 : 72}
          alt={data.title || "Club"}
          background="#FFFFFF"
          foreground="#0B1220"
          paddingRatio={0.14}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 90 : 70,
          top: collageTop,
          width: story ? 520 : 480,
          height: collageH,
          background: primary,
          overflow: "hidden",
        }}
      >
        <ArcBurst color={accent} size={story ? 560 : 420} top={-40} left={-80} rotate={-18} />
        <ArcBurst color={mixToward(accent, "#FFFFFF", 0.15)} size={story ? 420 : 300} bottom={-60} right={-90} rotate={140} />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 280 : 220,
          top: collageTop + (story ? 90 : 40),
          width: photoW,
          height: photoH,
          background: "#111",
          boxShadow: "18px 22px 0 rgba(11,18,32,0.12)",
          transform: "rotate(3.5deg)",
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

      <div
        style={{
          position: "absolute",
          left: padX,
          right: padX,
          bottom: story ? 56 : 40,
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#FFFFFF",
            border: `3px solid ${ink}`,
            color: ink,
            fontSize: story ? 20 : 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
            padding: "8px 14px",
            marginBottom: 10,
          }}
        >
          {data.subtitle || "Événement du club"}
        </div>

        <div style={{ background: primary, color: onPrimary, padding: story ? "22px 28px 18px" : "16px 22px 14px" }}>
          <div
            style={{
              fontSize: story ? 64 : 44,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
            }}
          >
            {data.title || "Soirée du club"}
          </div>
        </div>
        <div style={{ height: 10, background: accent }} />

        <div
          style={{
            marginTop: story ? 22 : 16,
            display: "flex",
            alignItems: "stretch",
            gap: 22,
            color: ink,
          }}
        >
          <div
            style={{
              fontSize: story ? 36 : 26,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
            }}
          >
            {data.date || "Date à confirmer"}
          </div>
          <div style={{ width: 3, background: ink, opacity: 0.85 }} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
            <div style={{ fontSize: story ? 32 : 22, fontWeight: 800, textTransform: "uppercase" }}>
              {data.time || "—"}
            </div>
            <div
              style={{
                fontSize: story ? 26 : 18,
                fontWeight: 600,
                textTransform: "uppercase",
                maxWidth: 520,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.venue || "Lieu à confirmer"}
            </div>
          </div>
        </div>
        {data.extraText ? (
          <div
            style={{
              marginTop: story ? 16 : 12,
              fontSize: story ? 20 : 16,
              fontWeight: 500,
              opacity: 0.72,
              maxWidth: 820,
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
