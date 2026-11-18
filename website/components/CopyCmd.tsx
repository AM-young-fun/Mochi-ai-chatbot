"use client";
import { useState } from "react";

/** A command in a box with a Copy button. If the clipboard is blocked, the command gets selected instead. */
export function CopyCmd({ cmd, copy, copied, spot }: { cmd: string; copy: string; copied: string; spot: string }) {
  const [done, setDone] = useState(false);
  const onCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      const code = e.currentTarget.parentElement?.querySelector("code");
      if (code) getSelection()?.selectAllChildren(code);
    }
  };
  return (
    <div className="dcmd">
      <code>{cmd}</code>
      <button type="button" onClick={onCopy} data-cta={spot}>{done ? copied : copy}</button>
    </div>
  );
}
