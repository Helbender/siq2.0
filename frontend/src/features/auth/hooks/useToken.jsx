// import { useState } from "react";

// export function useToken() {
//   function getToken() {
//     const userToken = sessionStorage.getItem("token");
//     return userToken && userToken;
//   }

//   const [token, setToken] = useState(getToken());

//   function saveToken(userToken) {
//     sessionStorage.setItem("token", userToken);
//     setToken(userToken);
//   }

//   function removeToken() {
//     sessionStorage.removeItem("token");
//     setToken(null);
//     console.log("Token Removed");
//   }

//   return {
//     setToken: saveToken,
//     token,
//     removeToken,
//   };
// }
