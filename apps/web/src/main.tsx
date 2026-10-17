import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "@/features/auth"
import "@workspace/ui/globals.css"
import { App } from "./app/router.tsx"
import { ThemeProvider } from "@/shared/model/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="amautai-theme">
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
