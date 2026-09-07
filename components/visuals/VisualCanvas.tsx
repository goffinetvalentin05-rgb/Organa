"use client";

import { forwardRef } from "react";
import { cn } from "@/components/ui";
import type { VisualTemplateDefinition } from "@/lib/visuals/templates/registry";
import { VISUAL_FORMAT_SIZE, type VisualData, type VisualFormat } from "@/lib/visuals/types";

type VisualCanvasProps = {
  template: VisualTemplateDefinition;
  data: VisualData;
  format: VisualFormat;
  scale?: number;
  className?: string;
};

const VisualCanvas = forwardRef<HTMLDivElement, VisualCanvasProps>(
  function VisualCanvas({ template, data, format, scale = 1, className }, ref) {
    const { width, height } = VISUAL_FORMAT_SIZE[format];
    const Render = template.Render;
    return (
      <div
        className={cn("relative bg-black shadow-[0_16px_40px_rgba(15,23,42,0.18)]", className)}
        style={{
          width: width * scale,
          height: height * scale,
          overflow: "hidden",
        }}
      >
        <div
          ref={ref}
          data-visual-export-root
          style={{
            width,
            height,
            transform: scale === 1 ? undefined : `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <Render data={data} format={format} />
        </div>
      </div>
    );
  }
);

export default VisualCanvas;
