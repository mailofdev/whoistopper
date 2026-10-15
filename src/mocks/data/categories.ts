import type { Category } from "@/types/domain";

export const categories: Category[] = [
  { id: "11111111-1111-4111-8111-111111111111", slug: "saas", name: "SaaS", description: "Software sold to Indian teams and businesses.", sortOrder: 1, isActive: true },
  { id: "22222222-2222-4222-8222-222222222222", slug: "developer-tools", name: "Developer tools", description: "Tools for people building software.", sortOrder: 2, isActive: true },
  { id: "33333333-3333-4333-8333-333333333333", slug: "fintech", name: "Fintech", description: "Money, invoices, and ledgers for Indian businesses.", sortOrder: 3, isActive: true },
  { id: "44444444-4444-4444-8444-444444444444", slug: "commerce", name: "Commerce", description: "Stores, catalogues, and D2C operations.", sortOrder: 4, isActive: true },
  { id: "55555555-5555-4555-8555-555555555555", slug: "education", name: "Education", description: "Learning products for students and tutors.", sortOrder: 5, isActive: true },
  { id: "66666666-6666-4666-8666-666666666666", slug: "health", name: "Health", description: "Clinics, wellness, and care coordination.", sortOrder: 6, isActive: true },
  { id: "77777777-7777-4777-8777-777777777777", slug: "climate", name: "Climate", description: "Energy, weather, and local environment tools.", sortOrder: 7, isActive: true },
  { id: "88888888-8888-4888-8888-888888888888", slug: "media", name: "Media", description: "Publishing and creative workflows.", sortOrder: 8, isActive: true },
];
