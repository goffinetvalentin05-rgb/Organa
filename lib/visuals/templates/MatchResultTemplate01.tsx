import type { VisualRenderProps } from "../types";
import { contrastText, mixToward } from "../colors";
import {
  BrushStroke,
  CoverPhoto,
  DiagonalStripes,
  GrainOverlay,
  HalftoneCorner,
  LogoMark,
  MarbleField,
  TORN_PHOTO_CLIP,
  isStory,
  scoreFontSize,
  splitDisplayTitle,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function MatchResultTemplate01({ data, format }: VisualRenderProps) {
  if (data.teamImageUrl) {
    return <MatchResultPhoto data={data} format={format} />;
  }
  return <MatchResultBlocks data={data} format={format} />;
}

function MatchResultBlocks({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";
  const primary = data.primaryColor;
  const accent = data.accentColor;
  const secondary = data.secondaryColor;
  const onAccent = contrastText(accent);
  const onPrimary = contrastText(primary);
  const [line1, line2] = splitDisplayTitle(data.title || "Résultat", "MATCH");
  const home = data.homeTeam || "Domicile";
  const away = data.awayTeam || "Extérieur";
  const label = (data.resultLabel || "FULL-TIME").toUpperCase();
  const padX = story ? 72 : 56;
  const padY = story ? 64 : 44;
  const towerW = story ? 430 : 360;
  const towerH = story ? 720 : 520;
  const tile = story ? 168 : 128;
  const homeScoreSize = scoreFontSize(data.homeScore || "0", story);
  const awayScoreSize = scoreFontSize(data.awayScore || "0", story);

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <MarbleField primary={primary} secondary={secondary} />
      <HalftoneCorner color={mixToward(primary, "#000000", 0.45)} size={story ? 380 : 280} top={-20} left={-20} />
      <HalftoneCorner color={mixToward(primary, "#000000", 0.45)} size={story ? 340 : 240} bottom={-30} right={-20} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: `${padY}px ${padX}px ${story ? 56 : 40}px`,
          color: ink,
        }}
      >
        <header style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: story ? 22 : 16,
              fontWeight: 700,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              opacity: 0.78,
            }}
          >
            {home}
          </div>
          <div
            style={{
              marginTop: story ? 18 : 8,
              fontSize: story ? 168 : 108,
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
              marginTop: story ? -8 : -4,
              fontSize: story ? 118 : 78,
              fontWeight: 800,
              lineHeight: 0.82,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {line2}
          </div>
          <div
            style={{
              marginTop: story ? 22 : 12,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 14,
              fontSize: story ? 34 : 24,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span style={ellipsis(story ? 380 : 300)}>{home}</span>
            <span style={{ color: accent, fontSize: story ? 28 : 20, fontWeight: 800 }}>V</span>
            <span style={ellipsis(story ? 380 : 300)}>{away}</span>
          </div>
        </header>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          <div style={{ position: "relative", width: towerW, height: towerH }}>
            <div style={{ position: "absolute", left: -tile * 0.42, top: tile * 0.12, zIndex: 2 }}>
              <LogoMark
                src={data.clubLogoUrl}
                size={tile}
                alt={home}
                background={accent}
                foreground={onAccent}
                paddingRatio={0.18}
              />
            </div>

            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={scoreCell(primary, homeScoreSize, { paddingTop: tile * 0.12 })}>
                {data.homeScore || "0"}
              </div>
              <div
                style={{
                  position: "relative",
                  background: primary,
                  color: onPrimary,
                  textAlign: "center",
                  fontSize: story ? 22 : 16,
                  fontWeight: 800,
                  letterSpacing: "0.28em",
                  padding: story ? "14px 16px" : "10px 12px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: -28,
                    right: -28,
                    top: "50%",
                    height: 3,
                    background: primary,
                    transform: "translateY(-50%)",
                  }}
                />
                <span style={{ position: "relative" }}>{label}</span>
              </div>
              <div style={scoreCell(primary, awayScoreSize, { paddingBottom: tile * 0.12 })}>
                {data.awayScore || "0"}
              </div>
            </div>

            <div style={{ position: "absolute", right: -tile * 0.42, bottom: tile * 0.12, zIndex: 2 }}>
              <LogoMark
                src={data.opponentLogoUrl}
                size={tile}
                alt={away}
                background={accent}
                foreground={onAccent}
                paddingRatio={0.18}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchResultPhoto({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";
  const primary = data.primaryColor;
  const accent = data.accentColor;
  const secondary = data.secondaryColor;
  const onAccent = contrastText(accent);
  const [line1, line2] = splitDisplayTitle(data.title || "Résultat", "MATCH");
  const home = data.homeTeam || "Domicile";
  const away = data.awayTeam || "Extérieur";
  const bannerH = story ? 240 : 188;
  const logoSize = story ? 108 : 84;
  const photoTop = story ? 300 : 220;
  const scoreSize = scoreFontSize(
    (data.homeScore || "0").length >= (data.awayScore || "0").length
      ? data.homeScore || "0"
      : data.awayScore || "0",
    story
  );

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${mixToward(primary, "#000000", 0.06)} 0%, ${primary} 40%, ${mixToward(primary, "#000000", 0.2)} 100%)`,
        }}
      />
      <HalftoneCorner color={mixToward(accent, "#FFFFFF", 0.18)} size={story ? 440 : 300} top={-30} left={-30} />
      <HalftoneCorner color={mixToward(accent, "#FFFFFF", 0.12)} size={story ? 320 : 220} bottom={bannerH} right={-20} />
      <DiagonalStripes color={accent} width={story ? 120 : 84} right={0} top={photoTop + 30} height={story ? 760 : 400} />
      <BrushStroke color={accent} width={story ? 72 : 52} height={story ? 600 : 340} left={0} top={photoTop + 90} />
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
          src={data.teamImageUrl}
          fit={data.teamImageFit}
          alt="Photo équipe"
          fallback={`linear-gradient(160deg, ${secondary}, ${mixToward(secondary, "#000000", 0.2)})`}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 30%, rgba(0,0,0,0.28) 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 48 : 36,
          right: story ? 48 : 36,
          top: story ? 48 : 32,
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
          {home}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: story ? 128 : 84,
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
            fontSize: story ? 88 : 58,
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
          alignItems: "center",
          justifyContent: "space-between",
          padding: story ? "0 32px" : "0 24px",
          gap: 16,
        }}
      >
        <LogoMark
          src={data.clubLogoUrl}
          size={logoSize}
          alt={home}
          background="rgba(11,18,32,0.92)"
          foreground="#FFFFFF"
          paddingRatio={0.14}
        />
        <div
          style={{
            fontSize: scoreSize * 0.55,
            fontWeight: 900,
            lineHeight: 0.8,
            letterSpacing: "-0.06em",
            minWidth: story ? 90 : 70,
            textAlign: "center",
          }}
        >
          {data.homeScore || "0"}
        </div>
        <div
          style={{
            fontSize: story ? 28 : 20,
            fontWeight: 700,
            fontStyle: "italic",
            opacity: 0.7,
          }}
        >
          vs
        </div>
        <div
          style={{
            fontSize: scoreSize * 0.55,
            fontWeight: 900,
            lineHeight: 0.8,
            letterSpacing: "-0.06em",
            minWidth: story ? 90 : 70,
            textAlign: "center",
          }}
        >
          {data.awayScore || "0"}
        </div>
        <LogoMark
          src={data.opponentLogoUrl}
          size={logoSize}
          alt={away}
          background="rgba(11,18,32,0.92)"
          foreground="#FFFFFF"
          paddingRatio={0.14}
        />
      </div>
    </div>
  );
}

function ellipsis(maxWidth: number) {
  return {
    maxWidth,
    overflow: "hidden" as const,
    textOverflow: "ellipsis" as const,
    whiteSpace: "nowrap" as const,
  };
}

function scoreCell(
  color: string,
  fontSize: number,
  extra: Record<string, number>
) {
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color,
    fontSize,
    fontWeight: 900,
    lineHeight: 0.8,
    letterSpacing: "-0.06em",
    ...extra,
  };
}
