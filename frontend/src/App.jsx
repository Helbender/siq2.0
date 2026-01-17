import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { ProtectedRoutes } from "@/features/shared/routes/ProtectedRoutes";
import { PublicRoutes } from "@/features/shared/routes/PublicRoutes";
import React from "react";
import { Navigate, Route, Routes } from "react-router";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {PublicRoutes}
        {ProtectedRoutes}
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
