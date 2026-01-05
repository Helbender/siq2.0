import React from "react";
import ReactDOM from "react-dom/client";
// import './index.css';
import App from "./App";
// import reportWebVitals from "./reportWebVitals";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { FlightProvider } from "@/features/flights/contexts/FlightsContext";
import { UserProvider } from "@/features/users/contexts/UserContext";

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
