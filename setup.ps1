#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# 🍲 NHÀNG HÀNG LẨU NƯỚNG - Frontend Setup Script
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         🍲 NHÀNG HÀNG LẨU NƯỚNG - Frontend Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📋 Kiểm tra yêu cầu..." -ForegroundColor Yellow

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js không được cài đặt!" -ForegroundColor Red
    Write-Host "Tải về tại: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = node -v
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green

# Check npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm không được cài đặt!" -ForegroundColor Red
    exit 1
}

$npmVersion = npm -v
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# Navigate to frontend
$frontendPath = "D:\fpt1\SRC_SMAS_CLIENT\frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    Write-Host "✅ Đã vào thư mục: $frontendPath" -ForegroundColor Green
} else {
    Write-Host "❌ Không tìm thấy thư mục frontend!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Menu
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Chọn tác vụ:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1️⃣  - Cài đặt dependencies (lần đầu)"
Write-Host "  2️⃣  - Chạy development server"
Write-Host "  3️⃣  - Build production"
Write-Host "  4️⃣  - Serve build folder locally"
Write-Host "  5️⃣  - Xem hướng dẫn deployment"
Write-Host "  6️⃣  - Docker build & run"
Write-Host "  0️⃣  - Thoát"
Write-Host ""

$choice = Read-Host "Nhập lựa chọn (0-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Đang cài đặt dependencies..." -ForegroundColor Yellow
        npm install
        Write-Host ""
        Write-Host "✅ Cài đặt hoàn thành!" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Khởi động development server..." -ForegroundColor Yellow
        Write-Host "⏳ Chờ một lát, trình duyệt sẽ mở tự động..." -ForegroundColor Cyan
        Write-Host ""
        npm start
    }
    "3" {
        Write-Host ""
        Write-Host "🔨 Đang build production..." -ForegroundColor Yellow
        npm run build
        Write-Host ""
        Write-Host "✅ Build hoàn thành!" -ForegroundColor Green
        Write-Host "📁 Output: build/" -ForegroundColor Cyan
    }
    "4" {
        Write-Host ""
        Write-Host "🌐 Cài đặt serve..." -ForegroundColor Yellow
        npm install -g serve
        Write-Host ""
        Write-Host "🌐 Serving build folder..." -ForegroundColor Yellow
        serve -s build
    }
    "5" {
        Write-Host ""
        Write-Host "📖 Hướng dẫn Deployment:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. VERCEL (Khuyến nghị - Free, 5 phút):" -ForegroundColor Yellow
        Write-Host "   git push origin main"
        Write-Host "   → Vercel deploy otomatis"
        Write-Host ""
        Write-Host "2. NETLIFY (Free, 5 phút):" -ForegroundColor Yellow
        Write-Host "   npm run build"
        Write-Host "   netlify deploy --prod --dir=build"
        Write-Host ""
        Write-Host "3. AWS/DOCKER (Scalable):" -ForegroundColor Yellow
        Write-Host "   docker build -t restaurant-app ."
        Write-Host "   docker run -p 3000:80 restaurant-app"
        Write-Host ""
        Write-Host "Xem chi tiết: DEPLOYMENT.md" -ForegroundColor Cyan
    }
    "6" {
        Write-Host ""
        Write-Host "🐳 Docker Setup:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Build image..." -ForegroundColor Cyan
        docker build -t restaurant-app:latest .
        Write-Host ""
        Write-Host "2. Run container..." -ForegroundColor Cyan
        docker run -p 3000:80 restaurant-app:latest
    }
    "0" {
        Write-Host ""
        Write-Host "👋 Tạm biệt!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "❌ Lựa chọn không hợp lệ!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
