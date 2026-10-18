@echo off
title ChillMusic Build
color 0B
echo ========================================================
echo   BUILD CHILLMUSIC - TAURI v2 + RUST + BUN
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/4] Thiet lap moi truong Rust / Cargo...
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"

where bun >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay bun. Cai dat tai: https://bun.sh
    pause
    exit /b 1
)

where cargo >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay cargo/rust. Cai dat tai: https://rustup.rs
    pause
    exit /b 1
)

echo [2/4] Thiet lap moi truong Visual Studio C++ Compiler...
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\Common7\Tools\VsDevCmd.bat" -arch=x64 >nul 2>&1
)

echo [3/4] Kiem tra thu vien dependencies...
if not exist "node_modules" (
    echo [INFO] Dang cai dat dependencies qua bun...
    call bun install
    if errorlevel 1 (
        echo [LOI] Khong the cai dat dependencies qua bun!
        pause
        exit /b 1
    )
)

echo [4/4] Bat dau build release (bun run tauri build)...
echo.
call bun run tauri build

if errorlevel 1 (
    echo.
    echo ========================================================
    echo   [THAT BAI] Build bi loi. Kiem tra log phia tren.
    echo ========================================================
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   BUILD THANH CONG!
echo   File .exe phat hanh:
echo   %~dp0src-tauri\target\release\chill-music.exe
echo ========================================================
echo.
pause
