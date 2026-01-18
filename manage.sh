#!/bin/bash

# Script để quản lý dự án React

case "$1" in
  "dev")
    echo "🚀 Starting development server..."
    npm start
    ;;
  "build")
    echo "🔨 Building production..."
    npm run build
    ;;
  "serve")
    echo "🌐 Serving build folder..."
    npm install -g serve
    serve -s build
    ;;
  "clean")
    echo "🧹 Cleaning up..."
    rm -rf node_modules build package-lock.json
    npm install
    npm run build
    ;;
  "test")
    echo "🧪 Running tests..."
    npm test
    ;;
  "docker-build")
    echo "🐳 Building Docker image..."
    docker build -t restaurant-app:latest .
    ;;
  "docker-run")
    echo "🐳 Running Docker container..."
    docker run -p 3000:80 restaurant-app:latest
    ;;
  *)
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev          - Run development server"
    echo "  build        - Build for production"
    echo "  serve        - Serve production build locally"
    echo "  clean        - Clean and reinstall dependencies"
    echo "  test         - Run tests"
    echo "  docker-build - Build Docker image"
    echo "  docker-run   - Run Docker container"
    ;;
esac
