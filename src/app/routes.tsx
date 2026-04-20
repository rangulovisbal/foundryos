import { createBrowserRouter, Navigate } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AppLayout } from "./components/foundry/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { ActionsPage } from "./pages/ActionsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { SupportPage } from "./pages/SupportPage";
import { TeamPage } from "./pages/TeamPage";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: LoginPage },
  { path: "/signup", Component: SignupPage },
  { path: "/verify-email", Component: VerifyEmailPage },
  { path: "/reset-password", Component: ResetPasswordPage },
  { path: "/onboarding", Component: OnboardingPage },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", Component: DashboardPage },
      { path: "/diagnostics", Component: DiagnosticsPage },
      { path: "/roadmap", Component: RoadmapPage },
      { path: "/actions", Component: ActionsPage },
      { path: "/assets", Component: AssetsPage },
      { path: "/support", Component: SupportPage },
      { path: "/team", Component: TeamPage },
    ],
  },
]);