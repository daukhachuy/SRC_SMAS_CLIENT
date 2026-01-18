@echo off
REM ═══════════════════════════════════════════════════════════════════════════════
REM 🍲 NHÀNG HÀNG LẨU NƯỚNG - Frontend Setup (Windows)
REM ═══════════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         🍲 NHÀNG HÀNG LẨU NƯỚNG - Frontend Setup              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo 📋 Checking requirements...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo ✅ Node.js: !NODE_VER!

npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo ✅ npm: !NPM_VER!
echo.

REM Navigate to frontend directory
cd /d "D:\fpt1\SRC_SMAS_CLIENT\frontend" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Cannot find frontend directory!
    echo Expected: D:\fpt1\SRC_SMAS_CLIENT\frontend
    pause
    exit /b 1
)

echo ✅ Found frontend directory
echo.

REM Menu
echo ═══════════════════════════════════════════════════════════════
echo Select task:
echo.
echo   1️⃣  - Install dependencies (first time)
echo   2️⃣  - Start development server
echo   3️⃣  - Build production
echo   4️⃣  - Serve build folder locally
echo   5️⃣  - View deployment guide
echo   6️⃣  - Docker build ^& run
echo   0️⃣  - Exit
echo.

set /p choice="Enter choice (0-6): "

if "%choice%"=="1" (
    cls
    echo 📦 Installing dependencies...
    echo.
    call npm install
    if %errorlevel% equ 0 (
        echo.
        echo ✅ Installation complete!
    ) else (
        echo.
        echo ❌ Installation failed!
    )
    pause
) else if "%choice%"=="2" (
    cls
    echo 🚀 Starting development server...
    echo ⏳ Browser will open automatically...
    echo.
    call npm start
) else if "%choice%"=="3" (
    cls
    echo 🔨 Building production...
    echo.
    call npm run build
    if %errorlevel% equ 0 (
        echo.
        echo ✅ Build complete!
        echo 📁 Output: build/ folder
    ) else (
        echo.
        echo ❌ Build failed!
    )
    pause
) else if "%choice%"=="4" (
    cls
    echo 🌐 Installing serve...
    call npm install -g serve
    echo.
    echo 🌐 Serving build folder...
    call serve -s build
) else if "%choice%"=="5" (
    cls
    echo 📖 Deployment Guide:
    echo.
    echo 1. VERCEL (Recommended - Free, 5 min):
    echo    git push origin main
    echo    → Visit vercel.com and import repository
    echo.
    echo 2. NETLIFY (Free, 5 min):
    echo    npm run build
    echo    netlify deploy --prod --dir=build
    echo.
    echo 3. Docker (Scalable):
    echo    docker build -t restaurant-app .
    echo    docker run -p 3000:80 restaurant-app
    echo.
    echo See DEPLOYMENT.md for more details.
    pause
) else if "%choice%"=="6" (
    cls
    echo 🐳 Docker Setup:
    echo.
    echo Building Docker image...
    docker build -t restaurant-app:latest .
    if %errorlevel% equ 0 (
        echo.
        echo Docker image created successfully!
        echo.
        echo Run container with:
        echo   docker run -p 3000:80 restaurant-app:latest
    ) else (
        echo ❌ Docker build failed!
    )
    pause
) else if "%choice%"=="0" (
    echo.
    echo 👋 Goodbye!
    exit /b 0
) else (
    echo.
    echo ❌ Invalid choice!
    pause
)

goto :eof
