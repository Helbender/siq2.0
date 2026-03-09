import { ErrorBoundary } from "@common/components/ErrorBoundary";
import { RequireAuth } from "@features/auth";
import { AuthenticatedLayout } from "@/shell/layout/AuthenticatedLayout";
import { Navigate } from "react-router";

// Feature routes (barrel imports)
import { DashboardPage } from "@features/dashboard";
import { DatabaseManagementPage } from "@features/db-management";
import { FlightsByCrewSearchPage, FlightsPage } from "@features/flights";
import { QualificationsPreviewPage } from "@features/qualifications-preview";
import { AboutPage } from "@common/pages/AboutPage";
import { CrewQualifications } from "@features/crew-qualifications";
import { QualificationManagementPage } from "@features/qualifications";
import { UserManagementPage } from "@features/users";
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
    { path: "/flights/search-by-crew", element: <FlightsByCrewSearchPage /> },
    { path: "/crew-qualifications", element: <CrewQualifications /> },
    { path: "/qualifications-preview", element: <QualificationsPreviewPage /> },
    {
      path: "/manage-qualifications",
      element: <QualificationManagementPage />,
    },
    { path: "/users", element: <UserManagementPage /> },
    { path: "/db-management", element: <DatabaseManagementPage /> },
    { path: "/about", element: <AboutPage /> },
  ],
};
