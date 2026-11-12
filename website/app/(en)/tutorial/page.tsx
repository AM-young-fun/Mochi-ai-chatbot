import { WatchPage } from "@/components/WatchPage";
import { tutorialMetadataFor } from "@/lib/site";
import { tutorialFor } from "@/lib/video";

const tv = tutorialFor("en");
export const metadata = tutorialMetadataFor("en", tv.name, tv.description, tv.poster);

export default function TutorialPage() {
  return <WatchPage lang="en" />;
}
