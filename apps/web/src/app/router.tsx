import { RouteLoading } from "./ui/route-loading"
import { lazy, Suspense } from "react"
import { NotFoundPage } from "@/pages/not-found"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AuthGuard } from "@/features/auth"

const LoginPage = lazy(() =>
  import("@/pages/login").then((module) => ({ default: module.LoginPage }))
)
const DashboardPage = lazy(() =>
  import("@/pages/dashboard").then((module) => ({
    default: module.DashboardPage,
  }))
)

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/callback"
                element={
                  <AuthGuard>
                    <Navigate to="/dashboard" replace />
                  </AuthGuard>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/forgot-password"
                element={<LoginPage mode="forgot" />}
              />
              <Route
                path="/reset-password"
                element={<LoginPage mode="reset" />}
              />
              <Route path="/signup" element={<LoginPage mode="signup" />} />
              <Route
                path="/verify-email"
                element={<LoginPage mode="verify" />}
              />
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <DashboardPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/:section"
                element={
                  <AuthGuard>
                    <DashboardPage />
                  </AuthGuard>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </MotionConfig>
  )
}
