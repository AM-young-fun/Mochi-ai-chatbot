import { Terms } from "@/components/Privacy";
import { TERMS } from "@/lib/terms";
import { termsMetadataFor } from "@/lib/site";

export const metadata = termsMetadataFor("en", TERMS.en.title, TERMS.en.description);

export default function TermsPage() {
  return <Terms lang="en" />;
}
