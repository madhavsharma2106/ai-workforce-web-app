import Link from "next/link";
import { Text } from "./Text";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
  className?: string;
};

export const Breadcrumb = ({ items, className }: Props) => (
  <nav aria-label="Breadcrumb" className={className}>
    <Text as="span" size="sm" tone="muted" className="flex items-center gap-1.5">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-gray-300">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-900 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </Text>
  </nav>
);
