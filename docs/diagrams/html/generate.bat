@echo off
echo 正在生成FoolCards项目分析文档HTML静态网页...

:: 检查是否安装了Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 错误: 未找到Node.js，请先安装Node.js
  exit /b 1
)

:: 检查是否安装了必要的依赖
echo 正在检查依赖...
cd %~dp0
if not exist node_modules (
  echo 正在安装依赖...
  npm install marked highlight.js
)

:: 运行生成脚本
echo 正在运行生成脚本...
echo 1. 生成HTML页面...
node generate_pages.js

echo 2. 生成文档内容...
node generate.js

echo 生成完成！
echo HTML静态网页已保存在 %~dp0 目录中
echo 请使用浏览器打开 index.html 查看文档

pause
