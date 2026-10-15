"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactAction } from "@/features/profiles/actions";
import { contactSchema } from "@/lib/validation/schemas";
import { Alert, Button, Field, TextArea, TextInput } from "@/components/ui/primitives";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const form = useForm({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", message: "" } });
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => {
      const result = await contactAction(values);
      setMessage(result.ok ? "Message received." : result.error);
      if (result.ok) form.reset();
    })}>
      {message ? <Alert tone={message === "Message received." ? "success" : "error"}>{message}</Alert> : null}
      <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
      <Field label="Email" error={form.formState.errors.email?.message}><TextInput type="email" {...form.register("email")} /></Field>
      <Field label="Message" error={form.formState.errors.message?.message}><TextArea {...form.register("message")} /></Field>
      <Button type="submit" disabled={form.formState.isSubmitting}>Send</Button>
    </form>
  );
}
