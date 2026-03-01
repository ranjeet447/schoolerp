"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export const ADVANCED_MODULES_HIDDEN_KEY = "schoolerp:ui:advanced_modules_hidden";
export const ADVANCED_MODULES_VISIBILITY_EVENT = "schoolerp:advanced-modules-visibility";
export const PREFERENCES_ENDPOINT = "/admin/settings/preferences";

let cachedServerPreference: boolean | null = null;
let preferencesHydrationPromise: Promise<boolean | null> | null = null;

function readHiddenPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADVANCED_MODULES_HIDDEN_KEY) === "1";
}

function writeHiddenPreference(hidden: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADVANCED_MODULES_HIDDEN_KEY, hidden ? "1" : "0");
}

function parseHiddenPreference(payload: any): boolean | null {
  const value =
    payload?.preferences?.ui?.hide_advanced_modules ??
    payload?.ui?.hide_advanced_modules ??
    payload?.data?.preferences?.ui?.hide_advanced_modules ??
    payload?.data?.ui?.hide_advanced_modules;

  return typeof value === "boolean" ? value : null;
}

async function fetchServerPreference(): Promise<boolean | null> {
  try {
    const response = await apiClient(PREFERENCES_ENDPOINT, { method: "GET" });
    if (!response?.ok) {
      return null;
    }

    const hidden = parseHiddenPreference(response);
    if (hidden === null) {
      return null;
    }

    cachedServerPreference = hidden;
    writeHiddenPreference(hidden);
    return hidden;
  } catch {
    return null;
  }
}

async function persistServerPreference(hidden: boolean): Promise<boolean> {
  const response = await apiClient(PREFERENCES_ENDPOINT, {
    method: "PUT",
    body: JSON.stringify({
      ui: { hide_advanced_modules: hidden },
    }),
  });
  if (!response?.ok) {
    throw new Error("failed to persist advanced modules preference");
  }

  const persisted = parseHiddenPreference(response) ?? hidden;
  cachedServerPreference = persisted;
  writeHiddenPreference(persisted);
  return persisted;
}

async function hydrateServerPreference(): Promise<boolean | null> {
  if (cachedServerPreference !== null) {
    return cachedServerPreference;
  }
  if (preferencesHydrationPromise) {
    return preferencesHydrationPromise;
  }

  preferencesHydrationPromise = fetchServerPreference().finally(() => {
    preferencesHydrationPromise = null;
  });
  return preferencesHydrationPromise;
}

export function setAdvancedModulesHiddenPreference(hidden: boolean) {
  if (typeof window === "undefined") return;
  writeHiddenPreference(hidden);
  window.dispatchEvent(
    new CustomEvent(ADVANCED_MODULES_VISIBILITY_EVENT, {
      detail: { hidden },
    }),
  );
}

export function useAdvancedModulesVisibility() {
  const [hideAdvancedModules, setHideAdvancedModules] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  useEffect(() => {
    setHideAdvancedModules(readHiddenPreference());

    hydrateServerPreference().then((serverHidden) => {
      if (typeof serverHidden === "boolean") {
        setHideAdvancedModules(serverHidden);
        setAdvancedModulesHiddenPreference(serverHidden);
      }
    });

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADVANCED_MODULES_HIDDEN_KEY) {
        setHideAdvancedModules(readHiddenPreference());
      }
    };

    const onVisibilityEvent = () => {
      setHideAdvancedModules(readHiddenPreference());
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ADVANCED_MODULES_VISIBILITY_EVENT, onVisibilityEvent);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ADVANCED_MODULES_VISIBILITY_EVENT, onVisibilityEvent);
    };
  }, []);

  return {
    hideAdvancedModules,
    showAdvancedModules: !hideAdvancedModules,
    isSavingPreference,
    setHideAdvancedModules: async (hidden: boolean) => {
      setHideAdvancedModules(hidden);
      setAdvancedModulesHiddenPreference(hidden);
      setIsSavingPreference(true);
      try {
        try {
          const persisted = await persistServerPreference(hidden);
          setHideAdvancedModules(persisted);
          setAdvancedModulesHiddenPreference(persisted);
          return persisted;
        } catch {
          // Keep local preference as offline fallback if persistence fails.
          return hidden;
        }
      } finally {
        setIsSavingPreference(false);
      }
    },
  };
}
