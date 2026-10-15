import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import { newToken, sha256 } from "@/lib/security/hash";
import { mockPasswordHash, verifyMockPassword } from "@/mocks/data/users";
import { toSession } from "@/mocks/present";
import { getStore } from "@/mocks/store";
import type { SessionUser } from "@/types/domain";

export const mockAuth = {
  authenticate(email: string, password: string): SessionUser | null {
    const user = getStore().users.find((item) => item.email.toLowerCase() === email.toLowerCase() && !item.deletedAt);
    if (!user || !verifyMockPassword(password, user.passwordHash)) return null;
    return toSession(user);
  },
  register(input: { email: string; password: string; displayName: string; username: string }): SessionUser {
    const store = getStore();
    if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AppError("An account with that email already exists.", "duplicate", 409);
    }
    if (store.users.some((user) => user.username === input.username)) {
      throw new AppError("That username is taken.", "duplicate", 409);
    }
    const user = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      passwordHash: mockPasswordHash(input.password),
      displayName: input.displayName,
      username: input.username,
      role: "user" as const,
      emailVerified: false,
      mfaEnabled: false,
      bio: "",
      website: null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    store.users.push(user);
    return toSession(user);
  },
  userById(id: string): SessionUser | null {
    const user = getStore().users.find((item) => item.id === id && !item.deletedAt);
    return user ? toSession(user) : null;
  },
  requestReset(email: string): { devLink?: string } {
    const store = getStore();
    const user = store.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && !item.deletedAt);
    if (!user) return {};
    const token = newToken();
    store.passwordResets.push({ tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 3600_000).toISOString() });
    const url = `/auth/update-password?token=${token}`;
    store.devInbox.unshift({ id: randomUUID(), to: user.email, subject: "Reset your password", url, createdAt: new Date().toISOString() });
    return { devLink: url };
  },
  resetPassword(token: string, password: string) {
    const store = getStore();
    const reset = store.passwordResets.find((item) => item.tokenHash === sha256(token) && item.expiresAt > new Date().toISOString());
    if (!reset) throw new AppError("This reset link is invalid or expired.", "invalid_token", 400);
    const user = store.users.find((item) => item.id === reset.userId);
    if (!user) throw new AppError("Account not found.", "not_found", 404);
    user.passwordHash = mockPasswordHash(password);
    store.passwordResets = store.passwordResets.filter((item) => item !== reset);
  },
  markEmailVerified(userId: string) {
    const user = getStore().users.find((item) => item.id === userId);
    if (user) user.emailVerified = true;
  },
};
