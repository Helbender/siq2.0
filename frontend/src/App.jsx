import React from "react";
import Pilots from "./pages/Pilots";
import Crew from "./pages/Crew";
import Flights from "./pages/Flights";
// const Flights = React.lazy(() => import("./pages/Flights"));
import Master from "./layout/Master";
import LoginPage from "./pages//LoginPage";
import RecoverPass from "./components/loginComponents/RecoverPass";
import { Fragment, useContext } from "react";
import Footer from "./layout/Footer";
import AboutPage from "./pages/About";
import RecoverProcess from "./components/loginComponents/RecoverProcess";

import { AuthContext } from "./Contexts/AuthContext";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import UserManagementPage from "./pages/UserManagementPage";

import Header from "./layout/Header";
import Dashboard from "./pages/Dashboard";

function App() {
  const { token, removeToken, setToken } = useContext(AuthContext);

  return (
    <HashRouter>
      <Header />
      {!token && token !== "" && token !== undefined ? (
        <Routes>
          <Route
            path="/"
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
            <Route index element={<Navigate replace to="flights" />} />
            <Route path="/flights" index element={<Flights />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagementPage />} />

            <Route path="/" element={<Master />}>
              <Route path="/pilots" element={<Pilots position="PC" />} />
              <Route path="/co-pilots" element={<Pilots position="CP" />} />
              <Route path="/crew" element={<Crew />} />
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
