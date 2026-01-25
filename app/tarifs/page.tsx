"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TarifsPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la section tarifs de la page d'accueil
    router.replace("/#tarifs");
  }, [router]);

  return null;
}































