'use client';

import React, { createContext, useContext, useState } from 'react';

interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const connect = () => {
    // 模拟连接
    setConnected(true);
    setPublicKey('DemoWallet1111111111111111111111111');
  };

  const disconnect = () => {
    setConnected(false);
    setPublicKey(null);
  };

  return (
    <WalletContext.Provider value={{ connected, publicKey, connect, disconnect }}>
      <div className="min-h-screen bg-gray-900 text-white">
        <header className="border-b border-gray-800 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">🎰 TPOT P2P</h1>
            {connected ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {publicKey?.slice(0, 8)}...
                </span>
                <button
                  onClick={disconnect}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
                >
                  断开
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                连接钱包
              </button>
            )}
          </div>
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </div>
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
