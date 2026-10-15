"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginAction, signupAction } from "@/features/auth/actions";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, TextInput } from "@/components/ui/primitives";

export function LoginForm({
  demo,
}: {
  demo: Array<{ email: string; password: string; label: string }> | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const result = await loginAction(values);
        if (!result.ok) setError(result.error);
        else router.push("/dashboard");
      })}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Email" error={form.formState.errors.email?.message}>
        <TextInput type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <TextInput type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      {demo ? (
        <div className="rounded-xl bg-muted p-3 text-xs text-secondary">
          <p className="font-semibold text-navy">Development accounts</p>
          <ul className="mt-2 space-y-1">
            {demo.map((account) => (
              <li key={account.email}>{account.label}: {account.email} / {account.password}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", username: "", email: "", password: "" },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setError("");
        const result = await signupAction(values);
        if (!result.ok) setError(result.error);
        else router.push("/auth/verify");
      })}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Name" error={form.formState.errors.displayName?.message}>
        <TextInput autoComplete="name" {...form.register("displayName")} />
      </Field>
      <Field label="Username" error={form.formState.errors.username?.message}>
        <TextInput autoComplete="username" {...form.register("username")} />
      </Field>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <TextInput type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <TextInput type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>Create account</Button>
    </form>
  );
}
