import { Layout } from "@/layout/layouts/AppLayout";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import {
  ForgotPasswordPage,
  ResetPasswordPage
} from "@features/auth";
import { LoginPage } from "@features/auth/pages/LoginPage";

export const publicRoutes = {
  element: <Layout />,
  errorElement: <ErrorBoundary />,
  children: [
    { path: "/login", element: <LoginPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
  ],
};
