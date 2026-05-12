import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { createBrowserRouter } from "react-router";
import { Navigate } from "react-router";
import { briefingRoutes, protectedRoutes } from "./protected.routes";
import { publicRoutes } from "./public.routes";

export const router = createBrowserRouter([
  {
    ...publicRoutes,
  },
  {
    ...protectedRoutes,
  },
  {
    ...briefingRoutes,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorBoundary />,
  },
]);
