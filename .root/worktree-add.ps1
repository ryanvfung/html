# Worktree-add wrapper — generic template (edit the marked defaults)
# Enforces: new worktrees go to <workspace-root>/.worktrees/ only, NEVER inside
# the git repo dir (<REPO_DIR>) — guards run on the FINAL target, so
# GIT_WORKTREE_ROOT relocation cannot bypass them. All logic lives here;
# worktree-add.bat is a thin shim.
# Usage: .\worktree-add.ps1 -Branch <name> [-Path <relative-to-workspace-root>]
# Default target: <workspace-root>\.worktrees\<branch>

param(
  [Parameter(Mandatory=$true)][string]$Branch,
  [string]$Path = ".worktrees/$Branch",
  [string[]]$SparseDirs = @("src","tests"),   # EDIT: cone-mode source/test dirs for your project layout (write reduction)
  [switch]$FullCheckout                        # force full checkout, ignore cone
)

# This script is synced to the workspace root by <REPO_DIR>/.root/copy-to-root.ps1,
# so $PSScriptRoot IS the workspace root. Never Split-Path -Parent (resolves
# to the parent of the real location — lesson from an earlier bypass bug).
$WsRoot = if ($PSScriptRoot) { $PSScriptRoot } else { $PWD.Path }
# Derive the git repo dir dynamically: the one immediate child of the workspace
# root that is a real repository (a directory named .git). Worktrees are
# excluded because their .git is a file, not a directory. Requires exactly one
# match so the script never guesses when the layout is ambiguous.
$RepoChild = @(Get-ChildItem -Path $WsRoot -Directory | Where-Object { Test-Path (Join-Path $_.FullName ".git") -PathType Container })
if ($RepoChild.Count -ne 1) {
  Write-Error "Workspace root mis-resolved ($WsRoot) — expected exactly one child directory with a real .git directory (the git repo), found $($RepoChild.Count). Run this script from its own location at the workspace root."
  exit 1
}
$RepoDir = $RepoChild[0].FullName
$AppPrefix  = $RepoDir + [System.IO.Path]::DirectorySeparatorChar
$WtPrefix   = (Join-Path $WsRoot ".worktrees") + [System.IO.Path]::DirectorySeparatorChar

# GUARD: target must never be inside the git repo dir ($RepoDir) — applied to the
# FINAL target (post-relocation) so GIT_WORKTREE_ROOT cannot bypass it.
function Assert-NotInsideApp([string]$Target, [string]$Ctx) {
  if ($Target.StartsWith($AppPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Error "REFUSED ($Ctx): target $Target is inside git dir ($RepoDir). Use .worktrees/ at the workspace root, not <repo>/worktrees/."
    exit 1
  }
}

# Absolute target under the workspace root — computed via Join-Path (NOT
# Resolve-Path, which throws on a not-yet-existing branch-dir). The branch-dir
# itself must NOT exist before `git worktree add`.
# GetFullPath THROWS on an illegal -Path (drive-qualified, illegal chars). Without
# a catch, $Target stays $null, the guards below stop failing closed (a null
# .StartsWith() is a statement error, so the condition evaluates false), and the
# script limps on to `git worktree add ""`. Fail closed instead.
try {
  $Target = [System.IO.Path]::GetFullPath((Join-Path $WsRoot $Path))
} catch {
  Write-Error "REFUSED: invalid -Path '$Path' -- $($_.Exception.Message)"
  exit 1
}
if (-not $Target) {
  Write-Error "REFUSED: -Path '$Path' did not resolve to a target path."
  exit 1
}

# GUARD: must be under <workspace-root>\.worktrees\ (canonical location).
Assert-NotInsideApp $Target "pre-relocation"
if (-not $Target.StartsWith($WtPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-Error "REFUSED: worktrees must go under $WtPrefix — got $Target."
  exit 1
}

# Secondary-disk relocation (write reduction): GIT_WORKTREE_ROOT overrides the
# target location; fall back to <workspace-root>/.worktrees/ when the drive is
# absent, never fail.
$Relocated     = $false
$RelocRoot     = $null
if ($env:GIT_WORKTREE_ROOT) {
  $candidate = if ([System.IO.Path]::IsPathRooted($env:GIT_WORKTREE_ROOT)) { $env:GIT_WORKTREE_ROOT } else { Join-Path $WsRoot $env:GIT_WORKTREE_ROOT }
  $drive = Split-Path $candidate -Qualifier
  if ($drive -and -not (Test-Path $drive)) {
    Write-Warning "GIT_WORKTREE_ROOT drive absent ($drive) — falling back to .worktrees/"
  } else {
    $RelocRoot = [System.IO.Path]::GetFullPath($candidate)
    $Target    = [System.IO.Path]::GetFullPath((Join-Path $RelocRoot $Branch))
    $Relocated = $true
  }
}

# Re-run guards on the FINAL target — relocation must never weaken them.
Assert-NotInsideApp $Target "post-relocation"
if ($Relocated) {
  $RelocPrefix = $RelocRoot + [System.IO.Path]::DirectorySeparatorChar
  if (-not $Target.StartsWith($RelocPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-Error "REFUSED (post-relocation): target $Target escapes GIT_WORKTREE_ROOT root $RelocRoot."
    exit 1
  }
}

# Create the parent of the final target (guards have now run).
$ParentDir = Split-Path $Target -Parent
if ($ParentDir -and -not (Test-Path $ParentDir)) { New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null }

Write-Host "Creating worktree at $Target (branch: $Branch) ..."
if (-not $FullCheckout -and $SparseDirs.Count -gt 0) {
  # Write reduction: cone-mode sparse checkout — only cone files written/deleted.
  # .githooks and .root are ALWAYS in the cone: without them the pre-commit
  # guards (drift audit + credential guard) are silently skipped in the
  # worktree, and the SSoT is unavailable. Never remove them from the cone.
  git -C $RepoDir worktree add --no-checkout "$Target" -b "$Branch"
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git worktree add failed (branch may already exist)."
    exit $LASTEXITCODE
  }
  # Every git step below is exit-checked: an unchecked failure is reported as
  # success (the old code printed "OK (sparse cone: ...)" for a cone git never
  # applied, and blamed the guard stack for a git error it never surfaced).
  git -C "$Target" sparse-checkout init --cone
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git sparse-checkout init failed in $Target -- the worktree has no cone. Undo: git worktree remove --force `"$Target`""
    exit $LASTEXITCODE
  }
  git -C "$Target" sparse-checkout set .githooks .root @SparseDirs
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git sparse-checkout set failed in $Target -- the cone was NOT applied. Undo: git worktree remove --force `"$Target`""
    exit $LASTEXITCODE
  }
  git -C "$Target" checkout
  if ($LASTEXITCODE -ne 0) {
    Write-Error "git checkout failed in $Target. Undo: git worktree remove --force `"$Target`""
    exit $LASTEXITCODE
  }
  # Post-verify: the guard stack must exist in the new worktree.
  if (-not (Test-Path (Join-Path (Join-Path $Target ".githooks") "pre-commit"))) {
    Write-Error "CREATED BUT UNVERIFIED: $Target has no .githooks/pre-commit — pre-commit guards would be skipped there. Investigate before committing in this worktree."
    exit 1
  }
  # Post-verify: the EFFECTIVE cone must hold every requested dir. git accepts
  # a non-existent dir in a cone without a warning, so a typo (or a dir missing
  # on this branch) would ship a narrower worktree while the script said OK.
  $effective = @(git -C "$Target" sparse-checkout list | ForEach-Object { $_.Trim().TrimEnd('/') })
  $expected  = @(".githooks", ".root") + @($SparseDirs | ForEach-Object { $_.Trim().TrimEnd('/') })
  $missing   = @($expected | Where-Object { $effective -notcontains $_ })
  if ($missing.Count -gt 0) {
    Write-Error "CREATED BUT UNVERIFIED: the cone in $Target is missing $($missing -join ', ') -- the worktree does not hold what was requested. Undo: git worktree remove --force `"$Target`""
    exit 1
  }
  # Post-verify: every requested dir must EXIST on this branch. git lists a
  # non-existent dir in the cone without complaining, so the check above
  # passes for a typo; only the index knows whether the dir has tracked files.
  $absent = @($expected | Where-Object { @(git -C "$Target" ls-files -- "$_").Count -eq 0 })
  if ($absent.Count -gt 0) {
    Write-Error "CREATED BUT UNVERIFIED: $($absent -join ', ') -- no tracked files on this branch, so the cone is wider than the worktree. Undo: git worktree remove --force `"$Target`""
    exit 1
  }
  Write-Host "OK (sparse cone: .githooks, .root, $($SparseDirs -join ', ')): $Target"
} else {
  git -C $RepoDir worktree add "$Target" -b "$Branch"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK (full checkout -- no sparse cone): $Target"
  } else {
    Write-Error "git worktree add failed."
    exit $LASTEXITCODE
  }
}
