"use client";
import { useEffect } from "react";

export default function BackendWaker() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/`)
      .catch(() => {}); // silent — just wakes Render up
  }, []);
  return null;
}
