import ReactMarkdown from "react-markdown";
import { Heading, Text } from "@/components/atoms";

type Props = {
  content: string;
};

export function Markdown({ content }: Props) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <Heading as="h4" size="sm" className="mt-4 first:mt-1">
            {children}
          </Heading>
        ),
        h2: ({ children }) => (
          <Heading as="h4" size="sm" className="mt-4 first:mt-1">
            {children}
          </Heading>
        ),
        h3: ({ children }) => (
          <Heading as="h5" size="sm" className="mt-4 first:mt-1">
            {children}
          </Heading>
        ),
        p: ({ children }) => (
          <Text size="sm" className="mt-1">
            {children}
          </Text>
        ),
        ul: ({ children }) => (
          <ul className="mt-1 list-disc space-y-1 pl-5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mt-1 list-decimal space-y-1 pl-5">{children}</ol>
        ),
        li: ({ children }) => (
          <Text as="li" size="sm">
            {children}
          </Text>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
