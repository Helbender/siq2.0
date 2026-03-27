import { http } from "@/app/config/http";

export const forgotPasswordRequest = (email) =>
  http.post("/auth/forgot-password", { email }).then((res) => res.data);

export const resetPasswordRequest = (token, password) =>
  http.post("/auth/reset-password", { token, password }).then((res) => res.data);
