import { createBrowserRouter } from "react-router";
import { Navigate } from "react-router";
import { protectedRoutes } from "./protected.routes";
import { publicRoutes } from "./public.routes";
import { ErrorBoundary } from "@/common/components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    ...publicRoutes,
  },
  {
    ...protectedRoutes,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorBoundary />,
  },
]);
