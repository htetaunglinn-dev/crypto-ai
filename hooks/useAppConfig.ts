'use client';

import { useEffect, useState } from 'react';

export interface AppConfig {
  database: boolean;
  oauth: { google: boolean; github: boolean };
}

/** Optional features configured on the server; null until loaded. */
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => {});
  }, []);

  return config;
}
