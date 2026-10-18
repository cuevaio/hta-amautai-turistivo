import { RouteLoading } from "./ui/route-loading"
import { LanguageTransition } from "./ui/language-transition"
import { lazy, Suspense } from "react"
import { NotFoundPage } from "@/pages/not-found"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AuthGuard } from "@/features/auth"
import { EducationGate, Onboarding } from "@/features/education"

const LandingPage = lazy(() =>
  import("@/pages/landing").then((module) => ({ default: module.LandingPage }))
)
const LegalPage = lazy(() =>
  import("@/pages/legal").then((module) => ({ default: module.LegalPage }))
)
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
      <LanguageTransition />
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/privacy"
                element={<LegalPage document="privacy" />}
              />
              <Route path="/terms" element={<LegalPage document="terms" />} />
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
                path="/onboarding"
                element={
                  <AuthGuard>
                    <EducationGate onboarding>
                      <Onboarding />
                    </EducationGate>
                  </AuthGuard>
                }
              />
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
                    <EducationGate>
                      <DashboardPage />
                    </EducationGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/:section"
                element={
                  <AuthGuard>
                    <EducationGate>
                      <DashboardPage />
                    </EducationGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/sessions/:sessionId"
                element={
                  <AuthGuard>
                    <EducationGate>
                      <DashboardPage sectionOverride="sessions" />
                    </EducationGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/rooms/:roomId"
                element={
                  <AuthGuard>
                    <EducationGate>
                      <DashboardPage sectionOverride="rooms" />
                    </EducationGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/rooms/:roomId/play/:participantId"
                element={
                  <AuthGuard>
                    <EducationGate>
                      <DashboardPage sectionOverride="rooms" />
                    </EducationGate>
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
