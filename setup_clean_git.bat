@echo off
title Reset va Upload Fresh Repo (Universal)
color 0C

echo ===============================================
echo     RESET VA UPLOAD CODE LEN GITHUB
echo ===============================================
echo.

rem --- Hoi nguoi dung nhap link GitHub ---
set /p GIT_URL=Nhap link repo GitHub (vi du: https://github.com/boyherokt/Tro-Ly.git): 
if "%GIT_URL%"=="" (
  echo Loi: Ban chua nhap link repo.
  pause
  exit /b
)

echo.
echo Dang lam sach repo local...
rmdir /s /q .git 2>nul

git init
git config init.defaultBranch main
git config core.ignorecase false

echo.
echo Dang add va commit file...
git add .
git commit -m "init: replace repo with new code"

echo.
echo Ket noi toi repo: %GIT_URL%
git remote add origin %GIT_URL%
git fetch --prune origin

echo.
echo Dang push code len GitHub (force)...
git push -u origin HEAD:main --force

echo.
echo Da thay toan bo repo tren GitHub bang code local.
pause
