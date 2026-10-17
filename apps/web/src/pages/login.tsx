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
        <div className="flex justify-center gap-2 md:justify-start">
          <Link to="/login" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <img src="/favicon.svg" alt="" className="size-6" />
            </div>
            Amautai
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
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
        <p className="text-center text-xs text-muted-foreground">
          Hack the Andes · 2026
        </p>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/login-amautai.webp"
          alt="Cumbres de los Andes al amanecer"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  )
}
