"use client";
import React from "react";
import { WodEditForm } from "../wod/WodEditForm";
import type { EditableWodBlock } from "../wod/wod-types";

type Props = {
  blocks: EditableWodBlock[];
  onBlocksChange: (blocks: EditableWodBlock[]) => void;
  onAnalyze: (data: {
    title: string;
    date: string;
    duration: string;
    effort: string;
    stimulus: string;
    tags: string[];
    blocks: EditableWodBlock[];
  }) => void;
  isAnalyzing?: boolean;
};

export const BlocksEditor: React.FC<Props> = ({ blocks, onBlocksChange, onAnalyze, isAnalyzing }) => {
  return (
    <WodEditForm
      blocks={blocks}
      onBlocksChange={onBlocksChange}
      onSave={onAnalyze}
      isSaving={isAnalyzing}
      primaryLabel="Analizar WOD"
      primaryDisabled={isAnalyzing}
    />
  );
};
