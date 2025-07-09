#!/bin/bash
set -e

echo "🏗️  构建 Sid 应用..."
wails build

echo "📦 打包应用..."
cd build/bin
zip -r Sid-$(date +%Y%m%d).zip Sid.app

echo "✅ 构建完成！"
echo "📍 应用位置: build/bin/Sid.app"
echo "📦 安装包: build/bin/Sid-$(date +%Y%m%d).zip"