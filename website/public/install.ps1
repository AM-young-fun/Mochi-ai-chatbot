# Mochi installer for Windows (PowerShell 5.1 or 7+).
# Open source: https://github.com/AM-young-fun/Mochi-ai-chatbot/blob/main/website/public/install.ps1
#
# What it does, and nothing else:
#   1. Installs Node.js LTS with winget (or the official installer from nodejs.org) if you don't have Node 22.13+.
#   2. Downloads Mochi from GitHub into %USERPROFILE%\mochi (or updates it, keeping your .env and data\).
#   3. Installs Mochi's npm packages and creates .env.
#   4. Starts Mochi and opens the dashboard at http://localhost:3000/dashboard,
#      where you choose your admin password the first time.
# Your data stays in %USERPROFILE%\mochi\data on this computer. Press Ctrl+C to stop Mochi.
#
# Usage (one line in PowerShell). Windows blocks scripts by default, so this switches the policy to
# Bypass for this PowerShell window only, then restores the original setting when the installer exits:
#   $p = Get-ExecutionPolicy -Scope Process; Set-ExecutionPolicy Bypass -Scope Process -Force; try { irm https://www.mochichatbot.com/install.ps1 | iex } finally { Set-ExecutionPolicy $p -Scope Process -Force }
#
# Options (environment variables): MOCHI_DIR (default %USERPROFILE%\mochi), MOCHI_NO_START=1 (install only).

& {
  $ErrorActionPreference = 'Stop'
  $ProgressPreference = 'SilentlyContinue'   # Invoke-WebRequest is much faster without the progress bar
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

  $Repo = 'AM-young-fun/Mochi-ai-chatbot'
  $Dir = if ($env:MOCHI_DIR) { $env:MOCHI_DIR } else { Join-Path $HOME 'mochi' }
  $NodeMin = [version]'22.13.0'

  function Say($m)  { Write-Host "[mochi] $m" -ForegroundColor Magenta }
  function Warn($m) { Write-Host "!  $m" -ForegroundColor Yellow }
  function Fail($m) { Write-Host "x  $m" -ForegroundColor Red; throw $m }

  function Update-PathFromRegistry {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
  }

  function Test-NodeOk {
    $node = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $node) { return $false }
    try { return ([version](& node.exe -p 'process.versions.node')) -ge $NodeMin } catch { return $false }
  }

  # --- 1. Node.js -------------------------------------------------------------
  if (Test-NodeOk) {
    Say "Node.js $(& node.exe -v) found."
  } else {
    Say 'Installing Node.js LTS...'
    if (Get-Command winget.exe -ErrorAction SilentlyContinue) {
      & winget.exe install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements | Out-Null
    } else {
      $lts = (Invoke-RestMethod 'https://nodejs.org/dist/index.json') | Where-Object { $_.lts } | Select-Object -First 1
      $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
      $msi = Join-Path $env:TEMP "node-$($lts.version)-$arch.msi"
      Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/node-$($lts.version)-$arch.msi" -OutFile $msi -UseBasicParsing
      Say 'Windows will ask for permission to install Node.js.'
      Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qb" -Wait
    }
    Update-PathFromRegistry
    if (-not (Test-NodeOk)) { Fail "Node.js install didn't work. Install Node.js 22.13+ from https://nodejs.org, open a new PowerShell window and run this again." }
    Say "Node.js $(& node.exe -v) ready."
  }

  # --- 2. Download or update Mochi -----------------------------------------------
  if ((Test-Path (Join-Path $Dir '.git')) -and (Get-Command git.exe -ErrorAction SilentlyContinue)) {
    Say "Updating Mochi in $Dir..."
    & git.exe -C $Dir pull --ff-only --quiet
    if ($LASTEXITCODE -ne 0) { Warn "Couldn't update with git; keeping the current version." }
  } else {
    Say "Downloading Mochi into $Dir..."
    $tmp = Join-Path $env:TEMP ("mochi-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $tmp | Out-Null
    try {
      $zip = Join-Path $tmp 'mochi.zip'
      Invoke-WebRequest "https://codeload.github.com/$Repo/zip/refs/heads/main" -OutFile $zip -UseBasicParsing
      Expand-Archive -Path $zip -DestinationPath $tmp -Force
      $src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
      New-Item -ItemType Directory -Path $Dir -Force | Out-Null
      # Copy the new code over the old one; .env and data\ are never touched.
      & robocopy.exe $src.FullName $Dir /E /XF .env /XD (Join-Path $src.FullName 'data') /NFL /NDL /NJH /NJS /NP | Out-Null
      if ($LASTEXITCODE -ge 8) { Fail "Couldn't copy Mochi into $Dir (robocopy exit code $LASTEXITCODE)." }
    } finally {
      Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    }
  }
  Set-Location $Dir

  # --- 3. Packages and .env ----------------------------------------------------------
  Say 'Installing packages (this takes a minute the first time)...'
  # npm.cmd, not npm: the npm.ps1 shim is exactly what a Restricted execution policy blocks.
  & npm.cmd install --no-audit --no-fund --loglevel=error
  if ($LASTEXITCODE -ne 0) { Fail 'npm install failed. See the messages above.' }

  if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Say 'Created .env.'
  }
  $port = 3000
  $portLine = Select-String -Path '.env' -Pattern '^PORT=(\d+)' | Select-Object -First 1
  if ($portLine) { $port = [int]$portLine.Matches[0].Groups[1].Value }

  if ($env:MOCHI_NO_START -eq '1') {
    Say "Installed. Start it any time with:  cd `"$Dir`"; npm.cmd start"
    return
  }

  # --- 4. Start and open the dashboard -------------------------------------------------
  $url = "http://localhost:$port/dashboard"
  Say 'Starting Mochi...'
  $proc = Start-Process -FilePath 'npm.cmd' -ArgumentList 'start' -WorkingDirectory $Dir -NoNewWindow -PassThru
  $up = $false
  for ($i = 0; $i -lt 60 -and -not $proc.HasExited; $i++) {
    try { Invoke-WebRequest "http://localhost:$port/health" -UseBasicParsing -TimeoutSec 2 | Out-Null; $up = $true; break } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $up) { Fail 'Mochi stopped while starting. See the messages above.' }

  Write-Host ''
  Say "Mochi is running: $url"
  Say 'The first time, the dashboard asks you to choose an admin password.'
  Say "Keep this window open. Press Ctrl+C to stop. Start again later with:  cd `"$Dir`"; npm.cmd start"
  Write-Host ''
  Start-Process $url
  $proc.WaitForExit()
}
