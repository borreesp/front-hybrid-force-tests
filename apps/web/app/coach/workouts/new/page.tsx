"use client";
import React from "react";
import { WodBuilder } from "../../../../components/wod-builder/WodBuilder";

export default function CoachWorkoutBuilderPage({
  searchParams
}: {
  searchParams?: { editWorkoutId?: string };
}) {
  return (
    <div className="space-y-6">
      <WodBuilder editWorkoutId={searchParams?.editWorkoutId} />
    </div>
  );
}
