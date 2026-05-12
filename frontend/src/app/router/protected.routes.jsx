import { AuthenticatedLayout } from "@/layout/layouts/AuthenticatedLayout";
import { BriefingLayout } from "@/layout/layouts/BriefingLayout";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { RequireAuth } from "@features/auth";
import { lazy } from "react";
import { Navigate } from "react-router";

const DashboardPage = lazy(() =>
  import("@features/dashboard").then((m) => ({ default: m.DashboardPage })),
);
const FlightsPage = lazy(() =>
  import("@features/flights").then((m) => ({ default: m.FlightsPage })),
);
const FlightsByCrewSearchPage = lazy(() =>
  import("@features/flights").then((m) => ({
    default: m.FlightsByCrewSearchPage,
  })),
);
const CrewQualifications = lazy(() =>
  import("@features/crew-qualifications").then((m) => ({
    default: m.CrewQualifications,
  })),
);
const QualificationsPreviewPage = lazy(() =>
  import("@features/qualifications-preview").then((m) => ({
    default: m.QualificationsPreviewPage,
  })),
);
const QualificationManagementPage = lazy(() =>
  import("@features/qualifications").then((m) => ({
    default: m.QualificationManagementPage,
  })),
);
const UserManagementPage = lazy(() =>
  import("@features/users").then((m) => ({ default: m.UserManagementPage })),
);
const DatabaseManagementPage = lazy(() =>
  import("@features/db-management").then((m) => ({
    default: m.DatabaseManagementPage,
  })),
);
const AboutPage = lazy(() =>
  import("@/shared/components/AboutPage").then((m) => ({
    default: m.AboutPage,
  })),
);
const Anomalias = lazy(() =>
  import("@features/aircraft_anomalies").then((m) => ({
    default: m.Anomalias,
  })),
);
const BriefingPage = lazy(() =>
  import("@features/briefing").then((m) => ({ default: m.BriefingPage })),
);

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

export const briefingRoutes = {
  element: (
    <RequireAuth>
      <BriefingLayout />
    </RequireAuth>
  ),
  errorElement: <ErrorBoundary />,
  children: [{ path: "/briefing", element: <BriefingPage /> }],
};
