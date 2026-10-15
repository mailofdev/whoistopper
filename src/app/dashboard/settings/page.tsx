import Link from "next/link";
import { requireUser } from "@/features/auth/session";
import { ProfileForm } from "@/features/auth/account-forms";
import { PageHeader } from "@/components/ui/primitives";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Settings" description="Public visitors see your name, username, and bio. Email stays private." />
      <ProfileForm defaults={{ displayName: user.displayName, username: user.username, bio: user.bio ?? "", website: user.website ?? "" }} />
      <p className="mt-6 text-sm"><Link className="font-semibold text-brand" href="/account/export">Download your data</Link> · <Link className="font-semibold text-danger" href="/account/delete">Delete account</Link></p>
    </>
  );
}

