import { RouteLoading } from "./ui/route-loading"
import { LanguageTransition } from "./ui/language-transition"
import { lazy, Suspense } from "react"
import { NotFoundPage } from "@/pages/not-found"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { AuthGuard } from "@/features/auth"
import { EducationGate, Onboarding } from "@/features/education"
import {
  FamilyOnboarding,
  FamilyGameGate,
  ProfileGate,
  ProfileTypeSelection,
} from "@/features/profiles"

const LandingPage = lazy(() =>
  import("@/pages/landing").then((module) => ({ default: module.LandingPage }))
)
const FamilyGamePage = lazy(() =>
  import("@/features/rooms").then((module) => ({
    default: module.FamilyGamePage,
  }))
)
const EvidencePage = lazy(() =>
  import("@/features/evidence").then((module) => ({
    default: module.EvidencePage,
  }))
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

function LegacyPanelRedirect() {
  const location = useLocation()
  const path = location.pathname
    .replace(/^\/dashboard(?=\/|$)/, "/panel")
    .replace(/^\/panel\/projects(?=\/|$)/, "/panel/proyectos")
    .replace(/^\/panel\/sessions(?=\/|$)/, "/panel/sesiones")
    .replace(/^\/panel\/rooms(?=\/|$)/, "/panel/salas")
    .replace(/^\/panel\/notifications(?=\/|$)/, "/panel/notificaciones")
    .replace(/^\/panel\/settings(?=\/|$)/, "/panel/configuracion")
    .replace(/^\/panel\/account(?=\/|$)/, "/panel/cuenta")
    .replace(/\/play(?=\/|$)/, "/jugar")
  return <Navigate to={path + location.search + location.hash} replace />
}

function LocalizedRouteRedirect({ to }: { to: string }) {
  const location = useLocation()
  return <Navigate to={to + location.search + location.hash} replace />
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LanguageTransition />
      <TooltipProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/evidence" element={<LocalizedRouteRedirect to="/lista-de-espera" />} />
              <Route path="/privacy" element={<LocalizedRouteRedirect to="/privacidad" />} />
              <Route path="/terms" element={<LocalizedRouteRedirect to="/terminos" />} />
              <Route path="/login" element={<LocalizedRouteRedirect to="/iniciar-sesion" />} />
              <Route path="/signup" element={<LocalizedRouteRedirect to="/crear-cuenta" />} />
              <Route path="/verify-email" element={<LocalizedRouteRedirect to="/verificar-correo" />} />
              <Route path="/forgot-password" element={<LocalizedRouteRedirect to="/recuperar-contrasena" />} />
              <Route path="/reset-password" element={<LocalizedRouteRedirect to="/restablecer-contrasena" />} />
              <Route path="/panel/projects/*" element={<LegacyPanelRedirect />} />
              <Route path="/panel/sessions/*" element={<LegacyPanelRedirect />} />
              <Route path="/panel/rooms/*" element={<LegacyPanelRedirect />} />
              <Route path="/panel/notifications" element={<LegacyPanelRedirect />} />
              <Route path="/panel/settings" element={<LegacyPanelRedirect />} />
              <Route path="/panel/account" element={<LegacyPanelRedirect />} />
              <Route path="/lista-de-espera" element={<EvidencePage />} />
              <Route
                path="/privacidad"
                element={<LegalPage document="privacy" />}
              />
              <Route path="/terminos" element={<LegalPage document="terms" />} />
              <Route path="/dashboard" element={<LegacyPanelRedirect />} />
              <Route path="/dashboard/*" element={<LegacyPanelRedirect />} />
              <Route
                path="/callback"
                element={
                  <AuthGuard>
                    <Navigate to="/panel" replace />
                  </AuthGuard>
                }
              />
              <Route path="/iniciar-sesion" element={<LoginPage />} />
              <Route
                path="/registro/perfil"
                element={
                  <AuthGuard loadingLayout="auth">
                    <ProfileGate selection loadingLayout="auth">
                      <ProfileTypeSelection />
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/registro/familia"
                element={
                  <AuthGuard loadingLayout="auth">
                    <ProfileGate familyOnboarding loadingLayout="auth">
                      <FamilyOnboarding />
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/registro/docente"
                element={
                  <AuthGuard loadingLayout="auth">
                    <ProfileGate loadingLayout="auth">
                      <EducationGate onboarding loadingLayout="auth">
                        <Onboarding />
                      </EducationGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/recuperar-contrasena"
                element={<LoginPage mode="forgot" />}
              />
              <Route
                path="/restablecer-contrasena"
                element={<LoginPage mode="reset" />}
              />
              <Route path="/crear-cuenta" element={<LoginPage mode="signup" />} />
              <Route
                path="/verificar-correo"
                element={<LoginPage mode="verify" />}
              />
              <Route
                path="/panel"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <EducationGate>
                        <DashboardPage />
                      </EducationGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/panel/familia/jugar"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <FamilyGameGate>
                        <FamilyGamePage />
                      </FamilyGameGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/panel/:section"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <EducationGate>
                        <DashboardPage />
                      </EducationGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/panel/sesiones/:sessionId"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <EducationGate>
                        <DashboardPage sectionOverride="sessions" />
                      </EducationGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/panel/salas/:roomId"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <EducationGate>
                        <DashboardPage sectionOverride="rooms" />
                      </EducationGate>
                    </ProfileGate>
                  </AuthGuard>
                }
              />
              <Route
                path="/panel/salas/:roomId/jugar/:participantId"
                element={
                  <AuthGuard>
                    <ProfileGate>
                      <EducationGate>
                        <DashboardPage sectionOverride="rooms" />
                      </EducationGate>
                    </ProfileGate>
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
