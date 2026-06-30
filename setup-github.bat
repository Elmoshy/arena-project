@echo off
setlocal enabledelayedexpansion

REM ============================================================================
REM setup-github.bat
REM Run this ONCE, from inside your project folder, the first time you push
REM a fresh/empty GitHub repo. For every push after that, use update.bat
REM instead -- running this script again on a repo that already has commits
REM is safe (it skips steps that are already done) but is not what you want
REM day to day.
REM ============================================================================

echo ============================================
echo  Arena - First-time GitHub setup
echo ============================================
echo.

REM --- Make sure we're being run from inside a project folder, not by accident from Desktop/Downloads ---
if not exist "package.json" (
    echo [ERROR] No package.json found in this folder.
    echo This script must be run from inside your project folder ^(the one with src, package.json, etc^).
    echo.
    pause
    exit /b 1
)

REM --- Check git is installed ---
where git >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Git is not installed or not on your PATH.
    echo Install it from https://git-scm.com/downloads and try again.
    echo.
    pause
    exit /b 1
)

REM --- Check git identity is configured; ask for it if not ---
git config --global user.email >nul 2>nul
if errorlevel 1 (
    echo Git needs to know your name and email for commits.
    set /p GIT_NAME="Enter your name (for git commits): "
    set /p GIT_EMAIL="Enter your email (for git commits): "
    git config --global user.name "!GIT_NAME!"
    git config --global user.email "!GIT_EMAIL!"
    echo.
)

REM --- Ask for the repo URL ---
set /p REPO_URL="Paste the GitHub repository URL (e.g. https://github.com/USERNAME/REPO.git): "
if "!REPO_URL!"=="" (
    echo [ERROR] No URL entered. Aborting.
    pause
    exit /b 1
)

echo.
echo Repo URL: !REPO_URL!
echo This folder: %cd%
echo.
set /p CONFIRM="Continue? This will initialize git here and push everything to that repo. (y/n): "
if /i not "!CONFIRM!"=="y" (
    echo Aborted.
    pause
    exit /b 0
)
echo.

REM --- Init git if not already a repo ---
if not exist ".git" (
    echo [1/5] Initializing git...
    git init
) else (
    echo [1/5] Git already initialized here, skipping.
)

echo [2/5] Setting branch to main...
git branch -M main

REM --- Set or update the remote ---
git remote get-url origin >nul 2>nul
if errorlevel 1 (
    echo [3/5] Adding remote origin...
    git remote add origin "!REPO_URL!"
) else (
    echo [3/5] Remote origin already set, updating URL just in case...
    git remote set-url origin "!REPO_URL!"
)

REM --- Stage everything (respects .gitignore -- .env.local is never included) ---
echo [4/5] Staging all files...
git add -A

echo [5/5] Committing and pushing...
git commit -m "Initial commit" 2>nul
if errorlevel 1 (
    echo [INFO] Nothing new to commit ^(maybe already committed^). Continuing to push...
)

git push -u origin main

echo.
if errorlevel 1 (
    echo ============================================
    echo  Something went wrong during push.
    echo  Scroll up to see the actual git error above.
    echo ============================================
) else (
    echo ============================================
    echo  Done! Your project is now on GitHub.
    echo  From now on, use update.bat for future changes.
    echo ============================================
)
echo.
pause
