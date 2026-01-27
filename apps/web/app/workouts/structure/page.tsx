"use client";
import React from "react";
import { WodBuilder } from "../../../components/wod-builder/WodBuilder";

export default function WorkoutStructurePage({
  searchParams
}: {
  searchParams?: { editWorkoutId?: string; draft?: string };
}) {
  return (
    <div className="space-y-6">
      <WodBuilder editWorkoutId={searchParams?.editWorkoutId} draftKey={searchParams?.draft} />
    </div>
  );
}
