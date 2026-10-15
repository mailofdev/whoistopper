"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { resetAction, updatePasswordAction } from "@/features/auth/actions";
import { deleteAccountAction, updateProfileAction } from "@/features/profiles/actions";
import { passwordSchema, profileSchema, resetSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, TextArea, TextInput } from "@/components/ui/primitives";

export function ResetForm() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const form = useForm({ resolver: zodResolver(resetSchema), defaultValues: { email: "" } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      const result = await resetAction(values);
      if (!result.ok) setMessage(result.error);
      else {
        setMessage("If that email has an account, a reset link is ready.");
        setLink(result.devLink ?? "");
      }
    })}>
      {message ? <Alert tone={message.startsWith("If") ? "success" : "error"}>{message}</Alert> : null}
      {link ? <p className="text-sm"><a className="font-semibold text-brand" href={link}>Open the development reset link</a></p> : null}
      <Field label="Email" error={form.formState.errors.email?.message}><TextInput type="email" {...form.register("email")} /></Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Send reset link</Button>
    </form>
  );
}

export function PasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const form = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { password: "" } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      const result = await updatePasswordAction({ ...values, token });
      if (!result.ok) setError(result.error);
      else router.push("/login");
    })}>
      {error ? <Alert>{error}</Alert> : null}
      <Field label="New password" error={form.formState.errors.password?.message}><TextInput type="password" autoComplete="new-password" {...form.register("password")} /></Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Update password</Button>
    </form>
  );
}

export function ProfileForm({ defaults }: { defaults: { displayName: string; username: string; bio: string; website: string } }) {
  const [message, setMessage] = useState("");
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      const result = await updateProfileAction(values);
      setMessage(result.ok ? "Profile saved." : result.error);
    })}>
      {message ? <Alert tone={message === "Profile saved." ? "success" : "error"}>{message}</Alert> : null}
      <Field label="Name" error={form.formState.errors.displayName?.message}><TextInput {...form.register("displayName")} /></Field>
      <Field label="Username" error={form.formState.errors.username?.message}><TextInput {...form.register("username")} /></Field>
      <Field label="Bio" error={form.formState.errors.bio?.message}><TextArea {...form.register("bio")} /></Field>
      <Field label="Website" error={form.formState.errors.website?.message}><TextInput {...form.register("website")} /></Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Save profile</Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      const result = await deleteAccountAction(email);
      if (!result.ok) setError(result.error);
    }}>
      {error ? <Alert>{error}</Alert> : null}
      <Field label="Type your email to confirm">
        <TextInput value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" />
      </Field>
      <Button type="submit" variant="danger">Delete account</Button>
    </form>
  );
}
