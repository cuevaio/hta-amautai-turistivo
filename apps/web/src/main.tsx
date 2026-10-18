import { StrictMode } from "react"
import "@/shared/i18n/config"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "@/features/auth"
import { EducationProvider } from "@/features/education"
import { ProfileProvider, useProfile } from "@/features/profiles"
import "@workspace/ui/globals.css"
import { App } from "./app/router.tsx"
import { ThemeProvider } from "@/shared/model/theme-provider.tsx"

function Application() {
  const { profile } = useProfile()
  return (
    <EducationProvider enabled={profile?.role === "teacher"}>
      <App />
    </EducationProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="amautai-theme">
      <AuthProvider>
        <ProfileProvider>
          <Application />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
