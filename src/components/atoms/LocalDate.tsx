"use client";

import { useId } from "react";
import { InlineScript } from "./InlineScript";

const RUN_TIMESTAMP_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

type Props = {
  date: string;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
};

/**
 * Renders `date` in the viewer's local time zone. `toLocaleString` on the server uses the
 * server's time zone, not the visitor's, so the initial render is corrected by an inline
 * script before paint (see node_modules/next/dist/docs/.../preventing-flash-before-hydration.md).
 */
export function LocalDate({
  date,
  className,
  options = RUN_TIMESTAMP_OPTIONS,
}: Props) {
  const id = useId();

  return (
    <>
      <time
        id={id}
        dateTime={date}
        suppressHydrationWarning
        className={className}
      >
        {new Date(date).toLocaleString("en-US", options)}
      </time>
      <InlineScript
        html={`{var n=document.getElementById("${id}");if(n)n.textContent=new Date("${date}").toLocaleString("en-US",${JSON.stringify(options)})}`}
      />
    </>
  );
}
