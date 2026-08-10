import { Public_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { ThemeProvider } from '@/components/app/theme-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/shadcn/utils';
import { getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';

const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const styles = getStyles(appConfig);
  const { pageTitle, pageDescription, companyName, logo, logoDark } = appConfig;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        publicSans.variable,
        commitMono.variable,
        'scroll-smooth font-sans antialiased'
      )}
    >
      <head>
        {styles && <style>{styles}</style>}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </head>
      <body className="overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="bg-background/40 border-border/20 fixed top-0 left-0 z-50 flex w-full flex-row items-center justify-between border-b p-4 backdrop-blur-xs md:p-6">
            <div className="flex items-center space-x-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 via-orange-500 to-emerald-600 text-sm font-black text-white shadow-md ring-1 ring-white/20">
                VB
              </div>
              <div className="flex flex-col">
                <span className="text-foreground flex items-center gap-2 text-sm font-bold tracking-tight">
                  Voice of Bharat
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    Helpline Live
                  </span>
                </span>
                <span className="text-muted-foreground font-sans text-[11px]">
                  जन वित्तीय सलाह सेवा | Financial Guidance
                </span>
              </div>
            </div>
            <div className="text-muted-foreground hidden items-center space-x-3 text-xs font-medium sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-600 dark:text-amber-400">
                Powered by <strong className="font-semibold">Murf Falcon TTS</strong>
              </span>
              <span className="text-foreground/40">•</span>
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.livekit.io/agents"
                className="hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors"
              >
                LiveKit Agents
              </a>
            </div>
          </header>

          {children}
          <div className="group fixed bottom-0 left-1/2 z-50 mb-2 -translate-x-1/2">
            <ThemeToggle className="translate-y-20 transition-transform delay-150 duration-300 group-hover:translate-y-0" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
