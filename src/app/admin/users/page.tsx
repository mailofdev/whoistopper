import { setRoleAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function UsersPage() {
  await requireAdmin();
  const users = await getServices().profiles.listAdmin();
  return (
    <>
      <PageHeader title="Users" description="Role changes are written to the audit log. The last super administrator cannot be demoted." />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-line text-secondary"><th className="py-2">Person</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {users.map((person) => (
              <tr key={person.id} className="border-b border-line">
                <td className="py-3">{person.displayName}<div className="text-secondary">{person.email}</div></td>
                <td colSpan={2}>
                  <form className="flex gap-2" action={async (formData) => {
                    "use server";
                    await setRoleAction({ userId: String(formData.get("userId")), role: String(formData.get("role")) });
                  }}>
                    <input type="hidden" name="userId" value={person.id} />
                    <select className="h-11 rounded-lg border border-line px-3" name="role" defaultValue={person.role} aria-label={`Role for ${person.displayName}`}>
                      <option value="user">User</option>
                      <option value="admin">Administrator</option>
                      <option value="super_admin">Super administrator</option>
                    </select>
                    <button className="h-11 rounded-lg border border-line px-3 text-sm font-semibold" type="submit">Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

