"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AthleteProfileResponse, CareerSnapshot } from "../lib/types";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useFetch<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let mounted = true;
    fetcher()
      .then((res) => mounted && setState({ data: res, loading: false, error: null }))
      .catch((err) => mounted && setState({ data: null, loading: false, error: err.message || "Error" }));
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  return state;
}

export function useAthleteProfile() {
  return useFetch<AthleteProfileResponse>(api.getAthleteProfile);
}

export function useAthleteCareer() {
  return useFetch<CareerSnapshot>(api.getAthleteCareer);
}
