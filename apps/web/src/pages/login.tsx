import { ThemeToggle } from "@/shared/ui/theme-toggle"
import { AuthArtwork } from "@/shared/ui/auth-artwork"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { BrandLogo } from "@/shared/ui/brand-logo"
import { PageLoading } from "@/shared/ui/page-loading"
import { useAuth } from "@/features/auth"
import { Navigate } from "react-router"
import { Link } from "react-router"
import { PasswordRecoveryForm } from "@/features/auth"
import { VerifyEmailForm } from "@/features/auth"
import { LoginForm } from "@/features/auth"

export function LoginPage({
  mode = "login",
}: {
  mode?: "login" | "signup" | "verify" | "forgot" | "reset"
}) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoading message="Comprobando tu sesión…" />
  if (user && mode !== "forgot" && mode !== "reset")
    return <Navigate to="/dashboard" replace />
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <BrandLogo />
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <LanguageSelector compact />
            <ThemeToggle className="size-9" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-xs">
            {mode === "verify" ? (
              <VerifyEmailForm />
            ) : mode === "forgot" || mode === "reset" ? (
              <PasswordRecoveryForm key={mode} reset={mode === "reset"} />
            ) : (
              <LoginForm key={mode} mode={mode} />
            )}
          </div>
        </div>
      </div>
      <AuthArtwork />
    </div>
  )
}
