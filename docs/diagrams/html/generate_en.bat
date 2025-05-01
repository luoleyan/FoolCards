@echo off
chcp 65001 > nul
echo Generating FoolCards project analysis HTML static pages...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js not found, please install Node.js first
  exit /b 1
)

:: Check if dependencies are installed
echo Checking dependencies...
cd %~dp0
if not exist node_modules (
  echo Installing dependencies...
  npm install marked highlight.js
)

:: Run generation scripts
echo Running generation scripts...

echo 1. Checking Markdown files...
node check_files.js

echo 2. Generating HTML pages...
node generate_pages.js

echo 3. Generating document content...
node generate.js || (
  echo Error: Failed to generate document content
  echo Don't worry, you can still view the static HTML files
)

echo Generation complete!
echo HTML static pages have been saved in %~dp0 directory
echo Please open index.html in your browser to view the documentation

pause
