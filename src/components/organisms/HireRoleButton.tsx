"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Eyebrow, Text } from "@/components/atoms";
import type { EmployeeRole } from "@/lib/employees";

type Props = {
  role: EmployeeRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

const HireRoleButton = ({ role, title, description, icon: Icon }: Props) => {
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
      className="rounded-lg border border-gray-900 bg-gray-900 p-6 text-left text-white transition hover:bg-gray-700 disabled:opacity-60"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
        <Icon size={20} className="text-white" />
      </div>
      <Eyebrow tone="accent-faint" className="mt-4">
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

export default HireRoleButton;
