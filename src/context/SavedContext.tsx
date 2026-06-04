"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSaved } from "@/hooks/useSaved";

type SavedContextValue = ReturnType<typeof useSaved>;

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const value = useSaved();
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSavedContext() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSavedContext must be used within SavedProvider");
  return ctx;
}
