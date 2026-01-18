import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthenticatedLayout } from "@/features/shared/layout/AuthenticatedLayout";
import { Navigate, Route } from "react-router";

// Test pages
import { QualificationManagementPage } from "@/features/qualifications/pages/QualificationManagementPage";
import { TestDashboardPage } from "@/features/test/pages/TestDashboardPage";
import { TestFlightsPage } from "@/features/test/pages/TestFlightsPage";
import { TestQualificationsPage } from "@/features/test/pages/TestQualificationsPage";
import { TestQualificationsTablePage } from "@/features/test/pages/TestQualificationsTablePage";
import { UserManagementPage } from "@/features/users/pages/UserManagementPage";

export const ProtectedRoutes = (
  <Route
    element={
      <RequireAuth>
        <AuthenticatedLayout />
      </RequireAuth>
    }
  >
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<TestDashboardPage />} />
    <Route path="/flights" element={<TestFlightsPage />} />
    <Route path="/qualifications" element={<TestQualificationsPage />} />
    <Route
      path="/qualifications-table"
      element={<TestQualificationsTablePage />}
    />
    <Route
      path="/manage-qualifications"
      element={<QualificationManagementPage />}
    />
    <Route path="/users" element={<UserManagementPage />} />
  </Route>
);
