<#
.SYNOPSIS
    Recursively syncs <REPO_DIR>/.root/ -> workspace root (one-way; .root/ is SSoT).
.DESCRIPTION
    Copies every file under <REPO_DIR>/.root/ to the matching path under the workspace
    root - subdirectories included - and skips this script so no stray
    copy-to-root.ps1 is created at the workspace root.

    .root/ is the authoritative source. Workspace-root copies are GENERATED:
    never edit them directly; edit the .root/ version and re-run this script.
    The pre-commit hook (<REPO_DIR>/.githooks/pre-commit) blocks commits while any
    mirror drifts from its .root/ source.

    Refuses when the resolved workspace root has no repo dir (e.g. when run from a
    worktree checkout) rather than guessing a target.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File <REPO_DIR>/.root/copy-to-root.ps1
#>
$ErrorActionPreference = "Stop"

$selfPath = $PSCommandPath
if (-not $selfPath) { Write-Error "Run this as a script file, not pasted."; exit 1 }

$rootSource = Split-Path -Parent $selfPath     # ...\<repo_dir>\.root
$appDir     = Split-Path -Parent $rootSource   # ...\<repo_dir>  (the git repo dir, derived from this script's own path)
$wsRoot     = Split-Path -Parent $appDir       # ...\<workspace root>
$repoDirName = Split-Path -Leaf $appDir        # <repo_dir> basename, used for {{REPO_DIR}} token substitution

if (-not (Test-Path $rootSource)) {
    Write-Error "Source .root/ not found at $rootSource"
    exit 1
}
if (-not (Test-Path $appDir)) {
    Write-Error "Workspace root mis-resolved to '$wsRoot' (no repo dir '$appDir' found there)."
    exit 1
}

$files = Get-ChildItem -Path $rootSource -Recurse -File |
         Where-Object { $_.FullName -ne $selfPath }

# Exclusion filter (defense in depth; matches .root/README.md + agents-file-layout.md):
# secrets and scratch are never mirrored to the workspace root, even if
# planted under .root/. NOTE: .env.example / .env.sample / .env.template are
# intentionally NOT excluded (documented trackable practice).
$excludePatterns = @(".env", "cookie_*.txt", "*_token.json", "*.tmp", "tmp_*")
function Test-Excluded([string]$name) {
    foreach ($pat in $excludePatterns) { if ($name -like $pat) { return $true } }
    return $false
}
$excluded = @($files | Where-Object { Test-Excluded $_.Name })
if ($excluded.Count -gt 0) {
    Write-Warning "Excluded files under .root/ (never synced — remove them): $($excluded.Name -join ', ')"
}
$files = $files | Where-Object { -not (Test-Excluded $_.Name) }

foreach ($file in $files) {
    $relative = $file.FullName.Substring($rootSource.Length).TrimStart([IO.Path]::DirectorySeparatorChar, '/')
    $dest     = Join-Path $wsRoot $relative
    $destDir  = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -LiteralPath $file.FullName -Destination $dest -Force
    # {{REPO_DIR}} token substitution (opt-in per file): synced text files that
    # literally contain {{REPO_DIR}} get it replaced with the derived repo-dir
    # basename ($repoDirName). Skips files without the token; binaries excluded
    # by the existing exclusion set are never reached here because they were
    # filtered out of $files above.
    $destContent = Get-Content -LiteralPath $dest -Raw
    if ($null -ne $destContent -and $destContent -like '*{{REPO_DIR}}*') {
        $destContent -replace '{{REPO_DIR}}', $repoDirName | Set-Content -LiteralPath $dest
    }
    Write-Host "Copied $relative -> $dest"
}
Write-Host "Done. $($files.Count) file(s) synced to $wsRoot."
