import { requireUser } from "@/features/auth/session";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/features/profiles/actions";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await getServices().notifications.list(user.id);
  return (
    <>
      <PageHeader title="Notifications" action={<form action={async () => { "use server"; await markAllNotificationsReadAction(); }}><button className="text-sm font-semibold text-brand" type="submit">Mark all read</button></form>} />
      {items.length === 0 ? <EmptyState title="No notices" body="Verification, review, and payment updates appear here." /> : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-secondary">{item.body}</p>
              {item.readAt ? null : <form className="mt-2" action={async () => { "use server"; await markNotificationReadAction(item.id); }}><button className="text-sm font-semibold text-brand" type="submit">Mark read</button></form>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

