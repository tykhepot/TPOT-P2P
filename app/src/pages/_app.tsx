import type { AppProps } from 'next/app'
import '../styles/globals.css'
import dynamic from 'next/dynamic'
import { LanguageProvider } from '@/i18n/LanguageContext'

const WalletProvider = dynamic(
  () => import('@/components/WalletProvider').then((mod) => mod.WalletProvider),
  { ssr: false }
)

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </WalletProvider>
  )
}
