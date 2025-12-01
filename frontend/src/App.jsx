import React, { useMemo, useState } from "react";
import Pilots from "./pages/Pilots";
import Flights from "./pages/Flights";
import Master from "./layout/Master";
import LoginPage from "./pages//LoginPage";
import RecoverPass from "./components/loginComponents/RecoverPass";
import { Fragment, useContext } from "react";
import Footer from "./layout/Footer";
import AboutPage from "./pages/About";
import RecoverProcess from "./components/loginComponents/RecoverProcess";
import Sidebar from "./components/Sidebar";
import { AuthContext } from "./Contexts/AuthContext";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import UserManagementPage from "./pages/UserManagementPage";

import Header from "./layout/Header";
import Dashboard from "./pages/Dashboard";
import FileUpload from "./components/UserC/FileUpload";
import QualificationManagement from "./pages/QualificationManagement";
import QualificationTable from "./pages/QualificationTable";
import api from "./utils/api";

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
      <Sidebar />
      {!token && token !== "" && token !== undefined ? (
        <Routes>
          <Route index element={<Navigate replace to="login" />} />

          <Route
            path="/login"
            element={
              <LoginPage setToken={setToken} removeToken={removeToken} />
            }
          />
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
            <Route path="/flights" element={<Flights />} />
            <Route path="/fileupload" element={<FileUpload />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route
              path="/qualificacoes"
              element={<QualificationManagement />}
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
                  element={<QualificationTable tipo={tipo} />}
                />
              ))}
            </Route>
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </Fragment>
      )}
      <Footer />
    </HashRouter>
  );
}

export default App;
