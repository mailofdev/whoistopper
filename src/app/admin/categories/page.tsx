import { saveCategoryAction } from "@/features/admin/actions";
import { requireAdmin } from "@/features/auth/session";
import { FIELD_SETS } from "@/config/catalogue";
import { Card, PageHeader } from "@/components/ui/primitives";
import { getServices } from "@/lib/services";
import type { Category } from "@/types/domain";

const fieldSets = Object.keys(FIELD_SETS);

export default async function CategoriesAdminPage() {
  await requireAdmin();
  const categories = await getServices().categories.listAll();
  return (
    <>
      <PageHeader title="Categories" description="Inactive categories stay out of the public directory. Field sets decide which extra questions a submission asks." />
      <Card>
        <h2 className="font-semibold">New category</h2>
        <CategoryFields />
      </Card>
      <div className="mt-3 grid gap-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CategoryFields category={category} />
          </Card>
        ))}
      </div>
    </>
  );
}

function CategoryFields({ category }: { category?: Category }) {
  return (
    <form className="mt-3 grid gap-2 sm:grid-cols-2" action={async (formData) => {
      "use server";
      await saveCategoryAction({
        id: String(formData.get("id") || "") || undefined,
        slug: String(formData.get("slug")),
        name: String(formData.get("name")),
        description: String(formData.get("description")),
        sortOrder: Number(formData.get("sortOrder")),
        isActive: formData.get("isActive") === "on",
        groupSlug: String(formData.get("groupSlug")),
        groupName: String(formData.get("groupName")),
        groupSort: Number(formData.get("groupSort")),
        fieldSet: String(formData.get("fieldSet")),
      });
    }}>
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <input className="h-11 rounded-lg border border-line px-3" name="name" defaultValue={category?.name ?? ""} aria-label="Name" required />
      <input className="h-11 rounded-lg border border-line px-3" name="slug" defaultValue={category?.slug ?? ""} aria-label="Slug" required />
      <input className="h-11 rounded-lg border border-line px-3 sm:col-span-2" name="description" defaultValue={category?.description ?? ""} aria-label="Description" />
      <input className="h-11 rounded-lg border border-line px-3" name="groupName" defaultValue={category?.groupName ?? "Digital Presence"} aria-label="Group name" required />
      <input className="h-11 rounded-lg border border-line px-3" name="groupSlug" defaultValue={category?.groupSlug ?? "digital-presence"} aria-label="Group slug" required />
      <input className="h-11 rounded-lg border border-line px-3" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} aria-label="Sort order" />
      <input className="h-11 rounded-lg border border-line px-3" name="groupSort" type="number" defaultValue={category?.groupSort ?? 1} aria-label="Group sort" />
      <label className="text-sm">Field set
        <select className="mt-1 h-11 w-full rounded-lg border border-line px-3" name="fieldSet" defaultValue={category?.fieldSet ?? "website"} aria-label="Field set">
          {fieldSets.map((set) => <option key={set} value={set}>{set}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} /> Active</label>
      <button className="h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand" type="submit">{category ? "Save" : "Create"}</button>
    </form>
  );
}
