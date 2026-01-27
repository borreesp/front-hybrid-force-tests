"use client";
export type EditableWodBlock = {
  id: string;
  exercise: string;
  volume: string;
  load: string;
  time?: string;
  note?: string;
};

export type WodDraft = {
  id: string;
  title: string;
  date: string;
  duration: string;
  stimulus: string;
  effort: string;
  tags: string[];
  image?: string | null;
  blocks: EditableWodBlock[];
  score: number;
  aerobicShare: number;
  athleteImpact: {
    loadDelta: number;
    enduranceDelta: number;
    strengthDelta: number;
  };
};
