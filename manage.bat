@echo off

REM Script để quản lý dự án React trên Windows

if "%1%"=="dev" (
    echo 🚀 Starting development server...
    npm start
) else if "%1%"=="build" (
    echo 🔨 Building production...
    npm run build
) else if "%1%"=="serve" (
    echo 🌐 Serving build folder...
    npm install -g serve
    serve -s build
) else if "%1%"=="clean" (
    echo 🧹 Cleaning up...
    rmdir /s /q node_modules
    del package-lock.json
    npm install
    npm run build
) else if "%1%"=="test" (
    echo 🧪 Running tests...
    npm test
) else if "%1%"=="docker-build" (
    echo 🐳 Building Docker image...
    docker build -t restaurant-app:latest .
) else if "%1%"=="docker-run" (
    echo 🐳 Running Docker container...
    docker run -p 3000:80 restaurant-app:latest
) else (
    echo Usage: manage.bat [command]
    echo.
    echo Commands:
    echo   dev          - Run development server
    echo   build        - Build for production
    echo   serve        - Serve production build locally
    echo   clean        - Clean and reinstall dependencies
    echo   test         - Run tests
    echo   docker-build - Build Docker image
    echo   docker-run   - Run Docker container
)
