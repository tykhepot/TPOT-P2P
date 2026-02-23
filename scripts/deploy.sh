#!/bin/bash
# TPOT-P2P 部署脚本

set -e

echo "🚀 TPOT-P2P Deployment Script"
echo "=============================="

# 检查环境
command -v anchor >/dev/null 2>&1 || { echo "❌ 请先安装 Anchor CLI"; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "❌ 请先安装 Solana CLI"; exit 1; }

# 选择网络
NETWORK=${1:-devnet}
echo "📡 网络: $NETWORK"

# 配置 Solana CLI
solana config set --url $NETWORK

# 检查余额
BALANCE=$(solana balance | awk '{print $1}')
echo "💰 余额: $BALANCE SOL"

if [ "$NETWORK" = "devnet" ]; then
  if [ $(echo "$BALANCE < 1" | bc) -eq 1 ]; then
    echo "💸 空投 SOL..."
    solana airdrop 2
  fi
fi

# 构建程序
echo "🔨 构建 Anchor 程序..."
anchor build

# 部署程序
echo "📤 部署程序到 $NETWORK..."
anchor deploy --provider.cluster $NETWORK

# 获取程序 ID
PROGRAM_ID=$(cat target/deploy/tpot_p2p.json | jq -r '.programId')
echo "✅ 程序 ID: $PROGRAM_ID"

# 更新 Anchor.toml
sed -i "s/TPOTP2P11111111111111111111111111111111111/$PROGRAM_ID/g" Anchor.toml
sed -i "s/TPOTP2P11111111111111111111111111111111111/$PROGRAM_ID/g" programs/tpot-p2p/src/lib.rs

# 重新构建
echo "🔨 重新构建..."
anchor build

echo "✅ 部署完成!"
echo "程序 ID: $PROGRAM_ID"
