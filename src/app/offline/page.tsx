import { PageHeader } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Offline", "Reconnect to continue.", "/offline", false);

export default function OfflinePage() {
  return (
    <PageHeader
      title="You are offline"
      description="Listings, accounts, and payments need a connection. Reopen the page after you are back online."
    />
  );
}
