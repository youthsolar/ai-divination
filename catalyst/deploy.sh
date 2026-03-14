#!/bin/bash
# deploy.sh — AppSail 安全部署腳本
# 確保 node_modules 存在後再 deploy，避免「Cannot find module」錯誤

set -e

APPSAIL_DIR="appsail/divinationServer"

echo "🔍 確認 node_modules..."
if [ ! -d "$APPSAIL_DIR/node_modules" ]; then
  echo "⚠️  node_modules 不存在，執行 npm install..."
  cd "$APPSAIL_DIR" && npm install && cd ../..
else
  echo "✅ node_modules 存在"
fi

echo "🚀 部署 AppSail..."
catalyst deploy

echo "✅ 部署完成"
