import { Route } from "react-router";
import { Layout } from "@/shared/layout/Layout";
import { LoginPage } from "@/features/auth/pages/LoginPage";

export const PublicRoutes = (
  <Route element={<Layout />}>
    <Route path="/login" element={<LoginPage />} />
  </Route>
);
