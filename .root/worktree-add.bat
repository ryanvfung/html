@echo off
REM Thin shim. ALL logic lives in worktree-add.ps1: root resolution, guards,
REM sparse-cone creation, GIT_WORKTREE_ROOT fallback. Do not add logic here —
REM an earlier .bat duplicated the .ps1 and diverged (full checkouts plus an
REM app\.worktrees bypass hole).
REM Usage: worktree-add.bat <branch> [relative-path-from-workspace-root]

setlocal
set "HERE=%~dp0"

if "%~1"=="" (
  echo Usage: worktree-add.bat ^<branch^> [relative-path-from-workspace-root]
  exit /b 2
)

if "%~2"=="" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%worktree-add.ps1" -Branch "%~1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%worktree-add.ps1" -Branch "%~1" -Path "%~2"
)
exit /b %ERRORLEVEL%
