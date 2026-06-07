@echo off
chcp 65001 >nul
echo.
echo  Taskora Website - 开发预览
echo  ============================
echo.

:: 检查 node_modules
if not exist "node_modules" (
  echo  [1/2] 安装依赖...
  npm install
  if errorlevel 1 (
    echo  [错误] 依赖安装失败，请检查 Node.js 是否已安装
    pause
    exit /b 1
  )
)

echo  [2/2] 启动开发服务器...
echo  访问地址: http://localhost:4321
echo  按 Ctrl+C 停止服务
echo.
npm run dev
pause
