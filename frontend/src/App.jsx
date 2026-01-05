import React, { useMemo, useState, Fragment, useContext } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Box } from "@chakra-ui/react";

import Pilots from "./pages/Pilots";
import { FlightsPage } from "@/features/flights/pages/FlightsPage";
import Master from "./layout/Master";
import Footer from "./layout/Footer";
import AboutPage from "./pages/About";
import Sidebar from "./components/Sidebar";
import Header from "./layout/Header";
import Dashboard from "./pages/Dashboard";
import { QualificationManagementPage } from "@/features/qualifications/pages/QualificationManagementPage";
import { QualificationTablePage } from "@/features/qualifications/pages/QualificationTablePage";

import { UserManagementPage } from "@/features/users/pages/UserManagementPage";
import { FileUpload } from "@/features/users/components/FileUpload";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RecoverPass } from "@/features/auth/components/RecoverPass";
import { RecoverProcess } from "@/features/auth/components/RecoverProcess";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import api from "@/utils/api";

function App() {
  const { token, removeToken, setToken } = useContext(AuthContext);
  const [tipos, setTipos] = useState([]);

  useMemo(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/v2/listas");
        setTipos(res.data.tipos);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <HashRouter>
      <Header />
      <Box pt="75px">
        {!token && token !== "" && token !== undefined ? (
          <Routes>
            <Route index element={<Navigate replace to="login" />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/recover" element={<RecoverPass />} />
            <Route
              exact
              path="/recovery/:token/:email"
              element={<RecoverProcess />}
            />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        ) : (
          <Fragment>
            <Routes>
              <Route index element={<Navigate replace to="dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/flights" element={<FlightsPage />} />
              <Route path="/fileupload" element={<FileUpload />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route
                path="/qualificacoes"
                element={<QualificationManagementPage />}
              />

              <Route path="/" element={<Master />}>
                {tipos.map((tipo) => (
                  <Route
                    key={tipo}
                    path={`/${tipo
                      .toLowerCase()
                      .replace(" ", "-")
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")}`}
                    element={<Pilots tipo={tipo} />}
                  />
                ))}
                {tipos.map((tipo) => (
                  <Route
                    key={`${tipo}-table`}
                    path={`/${tipo
                      .toLowerCase()
                      .replace(" ", "-")
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")}-table`}
                    element={<QualificationTablePage tipo={tipo} />}
                  />
                ))}
              </Route>
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </Fragment>
        )}
        <Footer />
      </Box>
    </HashRouter>
  );
}

export default App;
