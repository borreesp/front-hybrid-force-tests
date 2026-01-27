"use client";
import React, { useState } from "react";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  initialId?: string;
  renderContent: (id: string) => React.ReactNode;
};

export const TabbedSection: React.FC<Props> = ({ tabs, initialId, renderContent }) => {
  const [active, setActive] = useState(initialId || tabs[0]?.id);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`chip-tab ${tab.id === active ? "chip-tab-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="card-base">
        {active ? renderContent(active) : null}
      </div>
    </div>
  );
};
