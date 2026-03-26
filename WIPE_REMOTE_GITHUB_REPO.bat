@echo off
TITLE CONNECT HER LMS Uploader
color 0a

echo =========================================================
echo GITHUB REPOSITORY WIPER - BY ANTIGRAVITY CODER
echo Target: https://github.com/She-Leads-Africa/sla_lms
echo =========================================================
echo.

echo [1/3] Creating a temporary, completely empty clean slate...
mkdir "%TEMP%\sla_empty_repo" 2>nul
cd /d "%TEMP%\sla_empty_repo"
git init >nul 2>&1
git commit --allow-empty -m "Wiping Remote Repository Clean" >nul 2>&1

echo [2/3] Uploading the empty state to GitHub to overwrite everything...
echo (If a GitHub login window pops up, please authenticate!)
git push -f https://github.com/She-Leads-Africa/sla_lms.git HEAD:main

echo.
echo [3/3] If the push was successful, the repository is now "new new" and 100% empty!
echo =========================================================
pause

