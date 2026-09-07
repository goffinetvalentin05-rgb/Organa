import type { VisualRenderProps } from "../types";
import { mixToward } from "../colors";
import {
  CoverPhoto,
  LogoMark,
  isStory,
  visualDisplayFont,
  visualRootStyle,
} from "./shared";

export function MatchResultTemplate01({ data, format }: VisualRenderProps) {
  const story = isStory(format);
  const ink = data.textColor || "#FFFFFF";

  return (
    <div className={visualDisplayFont.className} style={visualRootStyle(format)}>
      <CoverPhoto
        src={data.teamImageUrl}
        fit={data.teamImageFit}
        alt="Photo équipe"
        fallback={`radial-gradient(circle at 30% 20%, ${mixToward(data.primaryColor, "#FFFFFF", 0.12)}, ${data.secondaryColor})`}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${mixToward(data.secondaryColor, "#000000", 0.15)} 0%, rgba(0,0,0,0.18) 38%, ${data.secondaryColor} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: story ? 18 : 14,
          background: data.primaryColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: story ? 28 : 20,
          height: "100%",
          background: data.accentColor,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 48,
          right: story ? 72 : 56,
          top: story ? 72 : 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: ink,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              opacity: 0.7,
              fontWeight: 600,
            }}
          >
            {data.title || "Résultat"}
          </div>
          {data.resultLabel ? (
            <div
              style={{
                marginTop: 16,
                display: "inline-block",
                background: data.primaryColor,
                color: ink,
                padding: "10px 18px",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              {data.resultLabel}
            </div>
          ) : null}
        </div>
        <LogoMark src={data.clubLogoUrl} size={story ? 96 : 80} alt={data.homeTeam || "DOM"} />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 48 : 40,
          right: story ? 64 : 48,
          top: story ? "34%" : "30%",
          color: ink,
        }}
      >
        <TeamRow
          name={data.homeTeam || "Domicile"}
          logo={data.clubLogoUrl}
          score={data.homeScore || "0"}
          color={data.primaryColor}
          story={story}
        />
        <div
          style={{
            height: 4,
            margin: story ? "22px 0" : "14px 0",
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <TeamRow
          name={data.awayTeam || "Extérieur"}
          logo={data.opponentLogoUrl}
          score={data.awayScore || "0"}
          color="transparent"
          story={story}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: story ? 56 : 48,
          bottom: story ? 64 : 48,
          fontSize: 16,
          letterSpacing: "0.36em",
          textTransform: "uppercase",
          opacity: 0.55,
          color: ink,
        }}
      >
        Full time
      </div>
    </div>
  );
}

function TeamRow({
  name,
  logo,
  score,
  color,
  story,
}: {
  name: string;
  logo: string | null;
  score: string;
  color: string;
  story: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: story ? "18px 22px" : "12px 16px",
        background: color === "transparent" ? "rgba(255,255,255,0.06)" : color,
      }}
    >
      <LogoMark src={logo} size={story ? 84 : 68} alt={name} />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: story ? 42 : 32,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: story ? 128 : 96,
          fontWeight: 700,
          lineHeight: 0.8,
          letterSpacing: "-0.04em",
          minWidth: story ? 140 : 110,
          textAlign: "right",
        }}
      >
        {score}
      </div>
    </div>
  );
}
