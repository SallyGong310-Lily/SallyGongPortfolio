#!/bin/bash
# Sally Gong Portfolio — 一键本地预览
# 双击本文件：自动启动本地 HTTP 服务器，并在浏览器里打开首页。
# 停止服务：按 Control + C，或直接关闭本窗口。

cd "$(dirname "$0")" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "没有找到 python3，请先安装（macOS 可在终端运行：xcode-select --install）。"
  read -r -p "按回车键退出…"
  exit 1
fi

PORT=8000
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt 8010 ]; then
    echo "端口 8000–8010 都被占用了，请先关闭占用端口的程序再试。"
    read -r -p "按回车键退出…"
    exit 1
  fi
done

URL="http://localhost:$PORT/"

clear
echo "================================================"
echo "  Sally Gong Portfolio · 本地预览"
echo "================================================"
echo "  目录：$(pwd)"
echo "  地址：$URL"
echo "  停止：按 Control + C，或直接关闭本窗口"
echo "================================================"
echo ""

# 等服务器就绪后再打开浏览器
( sleep 1.2; open "$URL" ) &

exec python3 -m http.server "$PORT" --bind 127.0.0.1