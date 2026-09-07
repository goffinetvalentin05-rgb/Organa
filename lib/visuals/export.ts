"use client";

import { toPng } from "html-to-image";

export async function waitForVisualReady(node: HTMLElement) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

export async function exportVisualPng(
  node: HTMLElement,
  size: { width: number; height: number }
): Promise<string> {
  await waitForVisualReady(node);
  return toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    skipAutoScale: true,
    width: size.width,
    height: size.height,
    canvasWidth: size.width,
    canvasHeight: size.height,
    style: {
      transform: "none",
      left: "0",
      top: "0",
    },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
