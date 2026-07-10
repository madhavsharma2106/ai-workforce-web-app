type Props = {
  html: string;
};

/** Runs synchronously during HTML parsing so client-only values land before first paint. */
export function InlineScript({ html }: Props) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
