@echo off
chcp 65001 > nul
echo FoolCards 项目图表自动更新脚本

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 错误: 未找到Node.js，请先安装Node.js
  exit /b 1
)

:: 检查是否安装了必要的依赖
echo 检查依赖...
npm list chokidar >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 安装必要的依赖...
  npm install chokidar
)

:: 运行自动更新脚本
echo 运行自动更新脚本...
node auto_update.js %*

echo.
echo 按任意键退出...
pause > nul
