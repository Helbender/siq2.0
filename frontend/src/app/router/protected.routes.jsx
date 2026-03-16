import { AuthenticatedLayout } from "@/layout/layouts/AuthenticatedLayout";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { RequireAuth } from "@features/auth";
import { Navigate } from "react-router";

import { AboutPage } from "@/shared/components/AboutPage";
import { Anomalias } from "@features/aircraft_anomalies";
import { CrewQualifications } from "@features/crew-qualifications";
import { DashboardPage } from "@features/dashboard";
import { DatabaseManagementPage } from "@features/db-management";
import { FlightsByCrewSearchPage, FlightsPage } from "@features/flights";
import { QualificationManagementPage } from "@features/qualifications";
import { QualificationsPreviewPage } from "@features/qualifications-preview";
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
    { path: "/anomalias", element: <Anomalias /> },

  ],
};
