import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Sua App',
  description: 'Descrição da app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
