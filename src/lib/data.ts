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

export const useIndex = () => useJson<Index>("/data/index.json");
export const useLeague = (key: string | undefined) => useJson<League>(key ? `/data/leagues/${key}.json` : null);
export const useRecord = () => useJson<PicksRecord>("/data/record.json");
export const loadLeague = (key: string) => getJson<League>(`/data/leagues/${key}.json`);
