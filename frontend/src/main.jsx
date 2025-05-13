import React from "react";
import ReactDOM from "react-dom/client";
// import './index.css';
import App from "./App";
// import reportWebVitals from "./reportWebVitals";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./Contexts/AuthContext";
import { FlightProvider } from "./Contexts/FlightsContext";
import { UserProvider } from "./Contexts/UserContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <AuthProvider>
        <FlightProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </FlightProvider>
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
);
