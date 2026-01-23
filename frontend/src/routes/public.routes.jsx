import { Layout } from "@/shell/layout/Layout";
import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/features/auth";
import { ErrorBoundary } from "@/common/components/ErrorBoundary";

export const publicRoutes = {
  element: <Layout />,
  errorElement: <ErrorBoundary />,
  children: [
    { path: "/login", element: <LoginPage /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
  ],
};
