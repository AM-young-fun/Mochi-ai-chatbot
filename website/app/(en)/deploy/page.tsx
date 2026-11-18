import { Deploy } from "@/components/Deploy";
import { DEPLOY } from "@/lib/deploy";
import { deployMetadataFor } from "@/lib/site";

export const metadata = deployMetadataFor("en", DEPLOY.en.title, DEPLOY.en.description);

export default function DeployPage() {
  return <Deploy lang="en" />;
}
