import Link from "next/link";
import { Fragment } from "react";

export type CrumbItem = { key: string; href?: string; label: string };

export function Crumbs({ items }: { items: CrumbItem[] }) {
  return (
    <div className="crumbs" style={{ marginBottom: 8 }}>
      {items.map((c, i) => (
        <Fragment key={c.key}>
          {i > 0 ? (
            <span className="sep" key={`sep-${c.key}`}>
              /
            </span>
          ) : null}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
        </Fragment>
      ))}
    </div>
  );
}
