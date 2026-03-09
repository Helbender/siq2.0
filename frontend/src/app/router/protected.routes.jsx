import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { RequireAuth } from "@features/auth";
import { AuthenticatedLayout } from "@/layout/layouts/AuthenticatedLayout";
import { Navigate } from "react-router";

import { DashboardPage, DASHBOARD_PERMISSIONS } from "@features/dashboard";
import { DatabaseManagementPage, DB_MANAGEMENT_PERMISSIONS } from "@features/db-management";
import { FlightsByCrewSearchPage, FlightsPage, FLIGHTS_PERMISSIONS } from "@features/flights";
import { QualificationsPreviewPage, QUALIFICATIONS_PREVIEW_PERMISSIONS } from "@features/qualifications-preview";
import { AboutPage } from "@/shared/components/AboutPage";
import { CrewQualifications, CREW_QUALIFICATIONS_PERMISSIONS } from "@features/crew-qualifications";
import { QualificationManagementPage, QUALIFICATIONS_PERMISSIONS } from "@features/qualifications";
import { UserManagementPage, USERS_PERMISSIONS } from "@features/users";

export const protectedRoutes = {
  element: (
    <RequireAuth>
      <AuthenticatedLayout />
    </RequireAuth>
  ),
  errorElement: <ErrorBoundary />,
  children: [
    { index: true, element: <Navigate to="/dashboard" replace /> },
    { path: "/dashboard", element: <DashboardPage />, meta: { permission: DASHBOARD_PERMISSIONS.READ } },
    { path: "/flights", element: <FlightsPage />, meta: { permission: FLIGHTS_PERMISSIONS.READ } },
    { path: "/flights/search-by-crew", element: <FlightsByCrewSearchPage />, meta: { permission: FLIGHTS_PERMISSIONS.READ } },
    { path: "/crew-qualifications", element: <CrewQualifications />, meta: { permission: CREW_QUALIFICATIONS_PERMISSIONS.READ } },
    { path: "/qualifications-preview", element: <QualificationsPreviewPage />, meta: { permission: QUALIFICATIONS_PREVIEW_PERMISSIONS.READ } },
    {
      path: "/manage-qualifications",
      element: <QualificationManagementPage />,
      meta: { permission: QUALIFICATIONS_PERMISSIONS.WRITE },
    },
    { path: "/users", element: <UserManagementPage />, meta: { permission: USERS_PERMISSIONS.READ } },
    { path: "/db-management", element: <DatabaseManagementPage />, meta: { permission: DB_MANAGEMENT_PERMISSIONS.ADMIN } },
    { path: "/about", element: <AboutPage /> },
  ],
};
