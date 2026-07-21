"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentRunStep } from "@/lib/types";
import { Card, Eyebrow, Heading } from "@/components/atoms";
import { ActivityTimeline } from "./ActivityTimeline";

type Props = {
  steps: AgentRunStep[];
  eyebrow?: string;
  title?: string;
  defaultExpanded?: boolean;
};

export const ActivityCard = ({
  steps,
  eyebrow = "What happened",
  title = "What I did",
  defaultExpanded = false,
}: Props) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card
      as="section"
      padding="lg"
      className={expanded ? "space-y-6" : undefined}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h2" size="md" className="mt-1">
            {title}
          </Heading>
        </div>
        {expanded ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>
      {expanded && <ActivityTimeline steps={steps} />}
    </Card>
  );
};
