import { http } from "@/api/http";

export const loginRequest = (nip, password) =>
  http.post("/auth/login", { nip, password }).then((res) => res.data);

export const registerRequest = (username, email, password) =>
  http
    .post("/auth/register", { username, email, password })
    .then((res) => res.data);

export const fetchMe = () => http.get("/auth/me").then((res) => res.data);

export const updateUserRequest = (data) =>
  http.put("/auth/update", data).then((res) => res.data);
