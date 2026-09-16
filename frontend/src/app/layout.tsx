import "@design-systems-orion/tokens/themes/aurora.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: {
    default: 'Aurora EADI',
    template: '%s | EADI'
  },
  description: 'Portal - Aurora EADI',
  icons: {
    icon: '/favicon-Aurora.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
