import { StrictMode } from "react"
import "@/shared/i18n/config"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "@/features/auth"
import { EducationProvider } from "@/features/education"
import "@workspace/ui/globals.css"
import { App } from "./app/router.tsx"
import { ThemeProvider } from "@/shared/model/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="amautai-theme">
      <AuthProvider>
        <EducationProvider>
          <App />
        </EducationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
