"use client";

import { useEffect } from "react";

export default function TarifsPage() {
  useEffect(() => {
    window.location.replace("/#tarifs");
  }, []);

  return null;
}
