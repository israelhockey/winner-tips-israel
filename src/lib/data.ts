import { useEffect, useState } from "react";
import type { Index, League, PicksRecord } from "./types";

// The data job writes static JSON into public/data; the site just reads it.
const cache = new Map<string, Promise<unknown>>();

function getJson<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    }));
  }
  return cache.get(path) as Promise<T>;
}

function useJson<T>(path: string | null) {
  const [state, setState] = useState<{ data: T | null; error: string | null }>({ data: null, error: null });
  useEffect(() => {
    if (!path) return;
    let live = true;
    setState({ data: null, error: null });
    getJson<T>(path)
      .then((data) => live && setState({ data, error: null }))
      .catch((e: Error) => live && setState({ data: null, error: e.message }));
    return () => { live = false; };
  }, [path]);
  return state;
}

const BASE = import.meta.env.BASE_URL;
export const useIndex = () => useJson<Index>(`${BASE}data/index.json`);
export const useLeague = (key: string | undefined) => useJson<League>(key ? `${BASE}data/leagues/${key}.json` : null);
export const useRecord = () => useJson<PicksRecord>(`${BASE}data/record.json`);
export const loadLeague = (key: string) => getJson<League>(`${BASE}data/leagues/${key}.json`);

// Club logos: "<sport>|<team>" -> [logo url, club colour]. Written by the data job.
export type Logos = Record<string, [string, string | null]>;
export const useLogos = () => useJson<Logos>(`${BASE}data/logos.json`);

// Ask the logo hosts for a small copy: ESPN resizes on its CDN, TheSportsDB has fixed sizes.
export function logoSrc(url: string, px: number) {
  const want = Math.ceil(px * 2);
  if (url.includes("a.espncdn.com/i/")) return `https://a.espncdn.com/combiner/i?img=${encodeURIComponent(url.replace("https://a.espncdn.com", ""))}&w=${want}&h=${want}`;
  if (url.includes("thesportsdb.com")) return `${url}/${want <= 64 ? "tiny" : "small"}`;
  return url;
}
