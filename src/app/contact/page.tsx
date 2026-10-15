import { ContactForm } from "@/features/contact/contact-form";
import { Card, PageHeader } from "@/components/ui/primitives";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata("Contact", "Send a message to the Who's Topper operators.", "/contact");

export default function ContactPage() {
  return (
    <Card className="mx-auto max-w-xl">
      <PageHeader title="Contact" description="Questions about a listing, a payment, or a report." />
      <ContactForm />
    </Card>
  );
}

