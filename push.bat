@echo off
title Push Bot Code (auto-fix branch)
color 0A

echo ===========================
echo   🟢  Pushing to GitHub...
echo ===========================
echo.

REM 1) Kiểm tra remote đã trỏ chưa (tùy repo của bạn, đổi URL nếu cần)
git remote -v >nul 2>&1 || git remote add origin https://github.com/boyherokt

REM 2) Lấy tên branch hiện tại
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD') do set CURBR=%%B
echo Current branch: %CURBR%

REM 3) Đổi sang 'main' nếu chưa phải
if /I not "%CURBR%"=="main" (
  git branch -M main
)

REM 4) Commit và push (set upstream nếu chưa có)
git add .
git commit -m "update: %date% %time%" 2>nul

REM Dùng HEAD:main để luôn đẩy vào main trên remote
git push -u origin HEAD:main

echo.
echo ✅  Done! Code has been pushed successfully!
pause
