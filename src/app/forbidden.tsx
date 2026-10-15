import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h1 className="text-3xl font-semibold">Access denied</h1>
      <p className="mt-3 text-sm text-secondary">This account cannot open that area.</p>
      <Link className="mt-6 inline-flex font-semibold text-brand" href="/">Go home</Link>
    </div>
  );
}
