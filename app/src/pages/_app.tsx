import type { AppProps } from 'next/app'
import '../styles/globals.css'
import dynamic from 'next/dynamic'

// 动态导入 WalletProvider，禁用 SSR
const WalletProvider = dynamic(
  () => import('@/components/WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
)

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  )
}
