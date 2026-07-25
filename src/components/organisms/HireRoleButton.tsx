"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Text } from "@/components/atoms";
import type { EmployeeRole } from "@/lib/employees";

type Props = {
  role: EmployeeRole;
  title: string;
  description: string;
  icon: ReactNode;
};

export const HireRoleButton = ({ role, title, description, icon }: Props) => {
  const router = useRouter();
  const [isHiring, setIsHiring] = useState(false);

  const handleHire = async () => {
    setIsHiring(true);
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await response.json();
    if (response.ok) {
      router.push(`/employee/${data.id}/onboarding`);
    } else {
      setIsHiring(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleHire}
      disabled={isHiring}
      className="h-full rounded-[20px] bg-(--surface) p-7 text-left transition hover:opacity-80 disabled:opacity-60"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-(--accent-soft-text)">
          {icon}
        </div>
        <div className="min-w-0">
          <Text size="md" weight="semibold">
            {title}
          </Text>
          <Text size="sm" tone="muted" className="mt-0.5 truncate">
            {description}
          </Text>
        </div>
        <Badge tone="accent" size="sm" className="ml-auto shrink-0">
          {isHiring ? "Hiring…" : "Open"}
        </Badge>
      </div>
    </button>
  );
};
