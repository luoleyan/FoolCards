@echo off
chcp 65001 > nul
echo Fixing paths in HTML files for FoolCards project analysis documentation...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js not found, please install Node.js first
  exit /b 1
)

:: Run fix script
node fix_paths.js

echo.
echo Path fixing complete!
echo.
echo Press any key to exit...
pause > nul
