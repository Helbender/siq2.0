import { Navigate, Route } from "react-router";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { AuthenticatedLayout } from "@/shared/layout/AuthenticatedLayout";

// Test pages
import { TestDashboardPage } from "@/features/test/pages/TestDashboardPage";
import { TestFlightsPage } from "@/features/test/pages/TestFlightsPage";
import { TestManageQualificationsPage } from "@/features/test/pages/TestManageQualificationsPage";
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
      element={<TestManageQualificationsPage />}
    />
    <Route path="/users" element={<UserManagementPage />} />
  </Route>
);
