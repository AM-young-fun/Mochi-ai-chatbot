// One-line installers shown in the setup guide. No imports: the repo-root tests read this file.
// The scripts live in website/public and are served from the site; the source links point at GitHub.

export type InstallOs = "macos" | "windows" | "linux";
export const INSTALL_OSES: InstallOs[] = ["macos", "windows", "linux"];
export const OS_LABEL: Record<InstallOs, string> = { macos: "macOS", windows: "Windows", linux: "Linux" };

const SITE = "https://www.mochichatbot.com";
const SOURCE = "https://github.com/AM-young-fun/Mochi-ai-chatbot/blob/main/website/public";

const UNIX = `curl -fsSL ${SITE}/install.sh | bash`;
// Windows blocks scripts by default (and npm's .ps1 shim with them). Allow them for this PowerShell
// window only, run the installer, then put the window's original policy back, even on failure.
const WINDOWS = `$p = Get-ExecutionPolicy -Scope Process; Set-ExecutionPolicy Bypass -Scope Process -Force; try { irm ${SITE}/install.ps1 | iex } finally { Set-ExecutionPolicy $p -Scope Process -Force }`;

export const INSTALL_COMMAND: Record<InstallOs, string> = { macos: UNIX, windows: WINDOWS, linux: UNIX };
export const INSTALL_SCRIPT: Record<InstallOs, { name: string; source: string; raw: string }> = {
  macos: { name: "install.sh", source: `${SOURCE}/install.sh`, raw: `${SITE}/install.sh` },
  linux: { name: "install.sh", source: `${SOURCE}/install.sh`, raw: `${SITE}/install.sh` },
  windows: { name: "install.ps1", source: `${SOURCE}/install.ps1`, raw: `${SITE}/install.ps1` },
};

/** Best guess of the visitor's OS from the browser; Windows when unsure (the most common desktop). */
export function detectOs(platform: string, userAgent: string): InstallOs {
  const s = `${platform} ${userAgent}`.toLowerCase();
  if (/android|iphone|ipad/.test(s)) return /mac|iphone|ipad/.test(s) ? "macos" : "windows";
  if (/mac/.test(s)) return "macos";
  if (/win/.test(s)) return "windows";
  if (/linux|x11|cros/.test(s)) return "linux";
  return "windows";
}
