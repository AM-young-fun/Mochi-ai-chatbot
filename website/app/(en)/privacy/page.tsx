import { Privacy } from "@/components/Privacy";
import { PRIVACY } from "@/lib/privacy";
import { privacyMetadataFor } from "@/lib/site";

export const metadata = privacyMetadataFor("en", PRIVACY.en.title, PRIVACY.en.description);

export default function PrivacyPage() {
  return <Privacy lang="en" />;
}
