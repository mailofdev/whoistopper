import { requireUser } from "@/features/auth/session";
import { startDomainVerificationAction, startEmailVerificationAction, checkDomainAction, simulateDomainAction } from "@/features/ownership/actions";
import { isMockDataEnabled } from "@/config/data-source";
import { Card, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function VerificationPage() {
  const user = await requireUser();
  const services = getServices();
  const [products, claims] = await Promise.all([
    services.products.listOwned(user.id),
    services.verification.listForUser(user.id),
  ]);
  const mock = isMockDataEnabled();
  return (
    <>
      <PageHeader title="Ownership" description="Verify by email link or by publishing a token file on the product domain." />
      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <h2 className="font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-secondary">{product.ownershipVerified ? "Verified" : "Not verified"} · {product.websiteUrl}</p>
            {product.ownershipVerified ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={async () => { "use server"; await startEmailVerificationAction(product.id); }}><button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white" type="submit">Email link</button></form>
                <form action={async () => { "use server"; await startDomainVerificationAction(product.id); }}><button className="h-11 rounded-lg border border-line px-4 text-sm font-semibold" type="submit">Domain file</button></form>
                <form action={async () => { "use server"; await checkDomainAction(product.id); }}><button className="h-11 rounded-lg border border-line px-4 text-sm font-semibold" type="submit">Check file</button></form>
                {mock ? <form action={async () => { "use server"; await simulateDomainAction(product.id); }}><button className="h-11 rounded-lg border border-line px-4 text-sm font-semibold" type="submit">Simulate file (dev)</button></form> : null}
              </div>
            )}
          </Card>
        ))}
      </div>
      <ul className="mt-6 space-y-2 text-sm text-secondary">
        {claims.map((claim) => (
          <li key={claim.id}>{claim.productName}: {claim.method} · {claim.status}{claim.devLink ? ` · ${claim.devLink}` : ""}{claim.host ? ` · publish the token at https://${claim.host}/.well-known/whoistopper.txt` : ""}</li>
        ))}
      </ul>
    </>
  );
}

