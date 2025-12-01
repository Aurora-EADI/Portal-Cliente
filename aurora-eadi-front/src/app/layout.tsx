import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Aurora EADI',
  description: 'Descrição da app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
