@echo off
TITLE Connecta LMS Uploader
color 0b

echo =========================================================
echo UPLOADING CONNECTA LMS CODEBASE
echo Target: https://github.com/She-Leads-Africa/sla_lms
echo =========================================================
echo.

echo (If it asks you to log in to GitHub, please do!)
echo Uploading...
git push -f https://github.com/She-Leads-Africa/sla_lms.git main

echo.
echo =========================================================
echo Done! Your code has been completely transferred!
pause
