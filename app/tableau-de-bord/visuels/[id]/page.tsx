"use client";

import { use } from "react";
import VisualEditor from "@/components/visuals/VisualEditor";

export default function VisuelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <VisualEditor visualId={id} />;
}
