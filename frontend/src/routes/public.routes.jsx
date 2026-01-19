import { Layout } from "@/shell/layout/Layout";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ErrorBoundary } from "@/common/components/ErrorBoundary";

export const publicRoutes = {
  element: <Layout />,
  errorElement: <ErrorBoundary />,
  children: [{ path: "/login", element: <LoginPage /> }],
};
