@echo off
title ChillMusic - Quick Push to GitHub
color 0B
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================================
echo   CHILLMUSIC - DONG BO CODE LEN GITHUB
echo ========================================================
echo.

:: 1. Kiem tra va dam bao remote origin chinh xac
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/boyherokt/ChillMusic.git
)

:: 2. Dam bao dang o nhanh main
for /f "delims=" %%B in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "CURBR=%%B"
if /I not "%CURBR%"=="main" (
    git branch -M main
)

:: 3. Stage toan bo thay doi
git add .

:: 4. Kiem tra xem co gi can commit khong
git diff --cached --quiet
if errorlevel 1 (
    echo [INFO] Phat hien cac thay doi moi.
    set "MSG="
    set /p "MSG=Nhap ghi chu commit (Nhan Enter de dung mac dinh): "
    if "!MSG!"=="" set "MSG=update: %date% %time%"
    git commit -m "!MSG!"
) else (
    echo [INFO] Khong co file nao thay doi moi, kiem tra commit chua day...
)

:: 5. Day code len GitHub
echo.
echo [INFO] Dang day code len GitHub (origin main)...
git push -u origin main

if errorlevel 1 (
    color 0C
    echo.
    echo ========================================================
    echo   [THAT BAI] Push khong thanh cong!
    echo   Kiem tra lai ket noi mang hoac xung dot git.
    echo ========================================================
) else (
    color 0A
    echo.
    echo ========================================================
    echo   [THANH CONG] Da dong bo code len GitHub!
    echo   Repository: https://github.com/boyherokt/ChillMusic
    echo ========================================================
)

echo.
pause
