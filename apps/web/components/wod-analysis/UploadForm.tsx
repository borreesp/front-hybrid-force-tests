"use client";
import React from "react";
import { WodImageUploader } from "../wod/WodImageUploader";
import type { EditableWodBlock } from "../wod/wod-types";

type Props = {
  onParsed: (payload: { imageUrl: string; blocks: EditableWodBlock[]; text?: string; warnings?: string[] }) => void;
  onProcessingChange?: (loading: boolean) => void;
  onUseReferenceWod?: () => Promise<{ imageUrl?: string | null; blocks: EditableWodBlock[] } | void>;
  processFile?: (file: File) => Promise<{ blocks: EditableWodBlock[]; text?: string; warnings?: string[] }>;
  useReferenceDisabled?: boolean;
  referenceMessage?: string | null;
  useReferenceLabel?: string;
};

export const UploadForm: React.FC<Props> = ({
  onParsed,
  onProcessingChange,
  onUseReferenceWod,
  processFile,
  useReferenceDisabled,
  referenceMessage,
  useReferenceLabel
}) => {
  return (
    <div className="space-y-4">
      <WodImageUploader
        onParsed={onParsed}
        onProcessingChange={onProcessingChange}
        onUseReferenceWod={onUseReferenceWod}
        processFile={processFile}
        useReferenceDisabled={useReferenceDisabled}
        referenceMessage={referenceMessage}
        useReferenceLabel={useReferenceLabel}
      />
    </div>
  );
};
