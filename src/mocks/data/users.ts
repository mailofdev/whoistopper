import { scryptSync, timingSafeEqual } from "node:crypto";
import type { UserRole } from "@/types/domain";

const SALT = "whoistopper-mock-v1";

export function mockPasswordHash(password: string): string {
  return scryptSync(password, SALT, 32).toString("hex");
}

export function verifyMockPassword(password: string, hash: string): boolean {
  const next = Buffer.from(mockPasswordHash(password), "hex");
  const current = Buffer.from(hash, "hex");
  if (next.length !== current.length) return false;
  return timingSafeEqual(next, current);
}

export interface SeedUser {
  id: string;
  email: string;
  password: string;
  displayName: string;
  username: string;
  role: UserRole;
  bio: string;
  website: string | null;
  mfaEnabled: boolean;
}

/** Fictional accounts. Passwords are used only by the development mock authenticator. */
export const DEMO_PASSWORD = "TopperDemo!2026";
export const ADMIN_PASSWORD = "TopperAdmin!2026";
export const SUPER_PASSWORD = "TopperSuper!2026";

export const seedUsers: SeedUser[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    email: "ananya@example.com",
    password: DEMO_PASSWORD,
    displayName: "Ananya Iyer",
    username: "ananya",
    role: "user",
    bio: "Builds small business software from Kochi.",
    website: "https://ananya.example",
    mfaEnabled: false,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    email: "rohan@example.com",
    password: DEMO_PASSWORD,
    displayName: "Rohan Deshmukh",
    username: "rohan",
    role: "user",
    bio: "Ships developer tools and commerce apps from Pune.",
    website: "https://rohan.example",
    mfaEnabled: false,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    email: "kabir@example.com",
    password: DEMO_PASSWORD,
    displayName: "Kabir Shah",
    username: "kabir",
    role: "user",
    bio: "Browses new Indian products.",
    website: null,
    mfaEnabled: false,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    email: "meera@example.com",
    password: ADMIN_PASSWORD,
    displayName: "Meera Nair",
    username: "meera",
    role: "admin",
    bio: "Reviews listings and reports.",
    website: null,
    mfaEnabled: true,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    email: "arjun@example.com",
    password: SUPER_PASSWORD,
    displayName: "Arjun Bose",
    username: "arjun",
    role: "super_admin",
    bio: "Looks after administrator access.",
    website: null,
    mfaEnabled: true,
  },
];

export const demoAccounts = [
  { email: "ananya@example.com", password: DEMO_PASSWORD, label: "Product owner" },
  { email: "rohan@example.com", password: DEMO_PASSWORD, label: "Product owner" },
  { email: "meera@example.com", password: ADMIN_PASSWORD, label: "Administrator" },
  { email: "arjun@example.com", password: SUPER_PASSWORD, label: "Super administrator" },
] as const;
