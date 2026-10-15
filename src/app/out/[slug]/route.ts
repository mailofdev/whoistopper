import { NextResponse } from "next/server";
import { getServices } from "@/lib/services";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const product = await getServices().products.getPublicBySlug(slug);
  if (!product) return new NextResponse("Not found", { status: 404 });
  await getServices().analytics.recordClick({
    productId: product.id,
    userAgent: request.headers.get("user-agent") ?? "",
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
  });
  return NextResponse.redirect(product.websiteUrl, { status: 302, headers: { "cache-control": "no-store" } });
}
