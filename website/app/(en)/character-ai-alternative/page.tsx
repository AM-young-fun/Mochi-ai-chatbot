import { CharacterAiPage } from "@/components/CharacterAi";
import { CHARACTER_AI } from "@/lib/character-ai";
import { characterAiMetadata } from "@/lib/site";

export const metadata = characterAiMetadata(CHARACTER_AI.title, CHARACTER_AI.description);

export default function CharacterAiRoute() {
  return <CharacterAiPage />;
}
