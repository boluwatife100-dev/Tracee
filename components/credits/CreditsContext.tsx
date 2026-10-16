"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type CreditsContextType = {
  credits: number;
  maxCredits: number;
  loading: boolean;
  refreshCredits: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextType>({
  credits: 10,
  maxCredits: 10,
  loading: true,
  refreshCredits: async () => {},
});

export const CREDITS_UPDATED_EVENT = "tracee:credits-updated";

export function notifyCreditsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT));
  }
}

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number>(10);
  const [maxCredits, setMaxCredits] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/me/credits");
      if (res.ok) {
        const data = (await res.json()) as { credits?: number; maxCredits?: number };
        if (typeof data.credits === "number") {
          setCredits(data.credits);
        }
        if (typeof data.maxCredits === "number") {
          setMaxCredits(data.maxCredits);
        }
      }
    } catch (err) {
      console.error("Failed to load credits", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialCredits = async () => {
      try {
        const res = await fetch("/api/me/credits");
        if (!cancelled && res.ok) {
          const data = (await res.json()) as { credits?: number; maxCredits?: number };
          if (typeof data.credits === "number") {
            setCredits(data.credits);
          }
          if (typeof data.maxCredits === "number") {
            setMaxCredits(data.maxCredits);
          }
        }
      } catch (err) {
        console.error("Failed to load credits", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialCredits();

    const handleUpdate = () => {
      void fetchCredits();
    };

    window.addEventListener(CREDITS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("focus", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(CREDITS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [fetchCredits]);

  return (
    <CreditsContext.Provider
      value={{
        credits,
        maxCredits,
        loading,
        refreshCredits: fetchCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
