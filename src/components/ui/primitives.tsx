import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-brand text-on-brand hover:bg-brand-hover",
        variant === "secondary" && "glass-field text-navy hover:bg-white/50",
        variant === "ghost" && "text-navy hover:bg-muted",
        variant === "danger" && "bg-danger text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "paid" | "free" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-muted text-secondary",
        tone === "paid" && "bg-muted text-brand",
        tone === "free" && "bg-muted text-navy",
        tone === "success" && "bg-teal/10 text-teal",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "danger" && "bg-danger/10 text-danger",
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-3xl p-5", className)}>{children}</div>;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "glass rounded-2xl px-4 py-3 text-sm",
        tone === "error" && "text-danger",
        tone === "info" && "text-navy",
        tone === "success" && "text-teal",
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-secondary">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint ? <span className="mt-1 block text-xs font-normal text-secondary">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-normal text-danger">{error}</span> : null}
    </label>
  );
}

const controlClass = "glass-field h-11 w-full rounded-2xl px-3 text-sm text-navy outline-none focus:border-brand";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={controlClass} {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-32 py-2")} {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={controlClass} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold text-brand">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-navy">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? <Link className="hover:text-navy" href={item.href}>{item.label}</Link> : <span className="text-navy">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("glass animate-pulse rounded-3xl", className)} />;
}

export function Pagination({
  page,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? <Link className="font-semibold text-brand" href={hrefFor(page - 1)}>Previous</Link> : <span />}
      <span className="text-secondary">Page {page} of {pages}</span>
      {page < pages ? <Link className="font-semibold text-brand" href={hrefFor(page + 1)}>Next</Link> : <span />}
    </nav>
  );
}
