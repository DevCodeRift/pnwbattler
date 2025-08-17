import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from '../components/Providers'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import ErrorBoundary from '../components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PW Battle Simulator',
  description: 'Multiplayer battle simulation for Politics and War',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900`}>
        <ErrorBoundary>
          <Providers>
            <div className="min-h-screen bg-gray-900">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 min-h-screen bg-gray-800">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
