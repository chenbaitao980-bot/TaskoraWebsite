@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set REMOTE_URL=https://github.com/chenbaitao980-bot/TaskoraWebsite.git
set BRANCH=main

echo.
echo  Taskora Website - 一键部署到 Vercel
echo  ======================================
echo.

:: ── 首次初始化 ────────────────────────────────────────────
if not exist ".git" (
  echo  [初始化] 首次运行，正在初始化 Git 仓库...
  git init
  git branch -M %BRANCH%
  git remote add origin %REMOTE_URL%
  echo  [初始化] 完成
  echo.
)

:: ── 检查远端是否已设置 ────────────────────────────────────
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo  [配置] 设置远端仓库...
  git remote add origin %REMOTE_URL%
)

:: ── 暂存所有改动 ──────────────────────────────────────────
echo  [1/3] 检查改动...
git status --short
echo.

git diff --quiet HEAD >nul 2>&1
git diff --cached --quiet >nul 2>&1

:: 检查是否有任何未跟踪或已修改的文件
git status --porcelain > "%TEMP%\git_status.txt"
for %%A in ("%TEMP%\git_status.txt") do set SIZE=%%~zA
if %SIZE%==0 (
  echo  没有需要提交的改动，工作区已是最新。
  echo.
  goto :push_only
)

git add .

:: ── 输入提交信息 ──────────────────────────────────────────
echo  [2/3] 提交改动
echo.
set /p MSG=  请输入提交说明（直接回车使用默认）:
if "!MSG!"=="" (
  for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set D=%%a-%%b-%%c
  for /f "tokens=1-2 delims=: " %%a in ("%time%") do set T=%%a:%%b
  set MSG=update: !D! !T!
)

git commit -m "!MSG!"
if errorlevel 1 (
  echo.
  echo  [错误] 提交失败，请检查 Git 配置
  pause
  exit /b 1
)

:: ── 推送到 GitHub ─────────────────────────────────────────
:push_only
echo.
echo  [3/3] 推送到 GitHub，Vercel 将自动部署...
git push -u origin %BRANCH%

if errorlevel 1 (
  echo.
  echo  [错误] 推送失败，可能原因：
  echo    - 未登录 GitHub（首次需要输入账号密码或 Token）
  echo    - 网络问题，请重试
  pause
  exit /b 1
)

echo.
echo  ======================================
echo  部署已触发！Vercel 正在构建中...
echo  查看进度: https://vercel.com/dashboard
echo  网站地址: https://taskora.vercel.app
echo  ======================================
echo.
pause
