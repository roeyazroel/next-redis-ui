import { RedisUI } from "@/components/redis-ui"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <main className="min-h-screen bg-background">
        <RedisUI />
      </main>
    </ThemeProvider>
  )
}
