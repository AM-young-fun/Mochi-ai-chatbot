import { Landing } from "@/components/Landing";
import { metadataFor } from "@/lib/site";

export const metadata = metadataFor("en");

export default function Home() {
  return <Landing lang="en" />;
}
