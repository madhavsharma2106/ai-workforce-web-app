"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AgentRunStep } from "@/lib/types";
import { Card, Eyebrow, Heading } from "@/components/atoms";
import ActivityTimeline from "./ActivityTimeline";

type Props = {
  steps: AgentRunStep[];
};

const ActivityCard = ({ steps }: Props) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card as="section" padding="lg" className={expanded ? "space-y-6" : undefined}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <Eyebrow>What happened</Eyebrow>
          <Heading as="h2" size="md" className="mt-1">
            Activity
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

export default ActivityCard;
