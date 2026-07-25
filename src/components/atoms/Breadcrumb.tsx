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
    <Text
      as="span"
      size="xs"
      tone="muted"
      className="flex items-center gap-1.5 text-(--muted-faint)"
    >
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-(--muted-faint-3)">
              {item.label}
            </Link>
          ) : (
            <span className="text-(--muted-faint-3)">{item.label}</span>
          )}
        </span>
      ))}
    </Text>
  </nav>
);
