import { ErrorBoundary } from "@/common/components/ErrorBoundary";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthenticatedLayout } from "@/shell/layout/AuthenticatedLayout";
import { Navigate } from "react-router";

// Feature routes
import { AboutPage } from "@/common/pages/AboutPage";
import { CrewQualifications } from "@/features/crew-qualifications/pages/CrewQualifications";
import { DashboardPage } from "@/features/dashboard/index";
import { DatabaseManagementPage } from "@/features/db-management/index";
import { FlightsPage } from "@/features/flights/index";
import { QualificationManagementPage } from "@/features/qualifications/pages/QualificationManagementPage";
import { UserManagementPage } from "@/features/users/pages/UserManagementPage";
export const protectedRoutes = {
  element: (
    <RequireAuth>
      <AuthenticatedLayout />
    </RequireAuth>
  ),
  errorElement: <ErrorBoundary />,
  children: [
    { index: true, element: <Navigate to="/dashboard" replace /> },
    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/flights", element: <FlightsPage /> },
    { path: "/crew-qualifications", element: <CrewQualifications /> },
    {
      path: "/manage-qualifications",
      element: <QualificationManagementPage />,
    },
    { path: "/users", element: <UserManagementPage /> },
    { path: "/db-management", element: <DatabaseManagementPage /> },
    { path: "/about", element: <AboutPage /> },
  ],
};
