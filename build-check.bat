@echo off
chcp 65001 >nul
echo.
echo  Taskora Website - 构建检测
echo  ============================
echo.

if not exist "node_modules" (
  echo  [1/2] 安装依赖...
  npm install
  if errorlevel 1 (
    echo  [错误] 依赖安装失败
    pause
    exit /b 1
  )
)

echo  [2/2] 执行生产构建...
npm run build

if errorlevel 1 (
  echo.
  echo  [失败] 构建出错，请查看上方报错信息
  pause
  exit /b 1
)

echo.
echo  [成功] 构建完成，产物在 dist\ 目录
echo.
echo  是否启动本地预览？(Y/N)
set /p choice=
if /i "%choice%"=="Y" (
  npm run preview
)
pause
