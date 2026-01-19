import { ErrorBoundary } from "@/common/components/ErrorBoundary";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthenticatedLayout } from "@/shell/layout/AuthenticatedLayout";
import { Navigate } from "react-router";

// Test pages
import { FlightsPage } from "@/features/flights/index";
import { CrewQualifications } from "@/features/pilots/pages/CrewQualifications";
import { QualificationManagementPage } from "@/features/qualifications/pages/QualificationManagementPage";
import { AboutPage } from "@/features/shared/pages/AboutPage";
import { TestDashboardPage } from "@/features/test/pages/TestDashboardPage";
import { TestQualificationsTablePage } from "@/features/test/pages/TestQualificationsTablePage";
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
    { path: "/dashboard", element: <TestDashboardPage /> },
    { path: "/flights", element: <FlightsPage /> },
    { path: "/crew-qualifications", element: <CrewQualifications /> },
    {
      path: "/qualifications-table",
      element: <TestQualificationsTablePage />,
    },
    {
      path: "/manage-qualifications",
      element: <QualificationManagementPage />,
    },
    { path: "/users", element: <UserManagementPage /> },
    { path: "/about", element: <AboutPage /> },
  ],
};
