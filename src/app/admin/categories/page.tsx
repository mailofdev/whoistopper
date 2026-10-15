import { saveCategoryAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { Card, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";

export default async function CategoriesAdminPage() {
  await requireAdmin();
  const categories = await getServices().categories.list();
  return (
    <>
      <PageHeader title="Categories" description="Inactive categories stay out of the public directory." />
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <form className="grid gap-2 sm:grid-cols-2" action={async (formData) => {
              "use server";
              await saveCategoryAction({
                id: String(formData.get("id")),
                slug: String(formData.get("slug")),
                name: String(formData.get("name")),
                description: String(formData.get("description")),
                sortOrder: Number(formData.get("sortOrder")),
                isActive: formData.get("isActive") === "on",
              });
            }}>
              <input type="hidden" name="id" value={category.id} />
              <input className="h-11 rounded-lg border border-line px-3" name="name" defaultValue={category.name} aria-label="Name" />
              <input className="h-11 rounded-lg border border-line px-3" name="slug" defaultValue={category.slug} aria-label="Slug" />
              <input className="h-11 rounded-lg border border-line px-3 sm:col-span-2" name="description" defaultValue={category.description} aria-label="Description" />
              <input className="h-11 rounded-lg border border-line px-3" name="sortOrder" type="number" defaultValue={category.sortOrder} aria-label="Sort order" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={category.isActive} /> Active</label>
              <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">Save</button>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}

