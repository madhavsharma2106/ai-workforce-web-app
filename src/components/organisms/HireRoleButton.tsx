"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Eyebrow, Text } from "@/components/atoms";
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
      className="rounded-[20px] bg-(--accent) p-6 text-left text-white transition hover:bg-(--accent-hover) disabled:opacity-60"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        {icon}
      </div>
      <Eyebrow tone="inverted" className="mt-4">
        {isHiring ? "Hiring…" : "Available now"}
      </Eyebrow>
      <Text size="lg" weight="semibold" className="mt-3 text-white!">
        {title}
      </Text>
      <Text size="sm" tone="inverted" className="mt-1.5">
        {description}
      </Text>
    </button>
  );
};
