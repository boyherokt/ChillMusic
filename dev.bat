@echo off
title ChillMusic Dev Launcher
color 0A
setlocal enabledelayedexpansion

:: 1. Kiem tra quyen Administrator (bat buoc cho app can thiep ban phim vao game)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [UAC] Dang yeu cau quyen Administrator...
    powershell -Command "Start-Process -FilePath '%~f0' -WorkingDirectory '%~dp0' -Verb RunAs"
    exit /b
)

:: Dam bao dung thu muc chua script
cd /d "%~dp0"

echo ========================================================
echo   CHILLMUSIC DEV LAUNCHER (ADMINISTRATOR)
echo ========================================================
echo.

:: 2. Thiet lap moi truong Rust / Cargo
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

:: 3. Thiet lap moi truong Visual Studio C++ Compiler
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
)

:: 4. Kiem tra thu vien node_modules
if not exist "node_modules" (
    echo [INFO] Phat hien chua cai dat dependencies.
    echo [INFO] Dang tien hanh chay 'bun install'...
    call bun install
    if errorlevel 1 (
        echo [ERROR] Khong the cai dat dependencies qua bun!
        pause
        exit /b 1
    )
)

:: 5. Khoi chay Tauri Dev
echo [INFO] Dang khoi chay ChillMusic trong che do phat trien (Dev)...
echo.
call bun run tauri dev

if errorlevel 1 (
    echo.
    echo [WARNING] Dev server da dung lai hoac gap su co.
)

pause
