import { useState, useEffect } from "react";

const globalApiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL_MS = 1000 * 60 * 5;

export function useCachedApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const cached = globalApiCache[url];

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (isMounted) {
          globalApiCache[url] = { data: json, timestamp: Date.now() };
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [url]);

  return { data, loading };
}
