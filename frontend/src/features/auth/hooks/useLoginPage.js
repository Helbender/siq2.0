import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toaster } from "../../../components/ui/toaster";
import { useLogin } from "../mutations/useLogin";

export function useLoginPage() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync, isPending, reset } = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const enteredLoginRoute =
      previousPathRef.current !== "/login" && location.pathname === "/login";

    if (enteredLoginRoute) {
      setNip("");
      setPassword("");
      setError("");
      reset();
    }

    previousPathRef.current = location.pathname;
    // Intentionally keyed to route transitions only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const promise = mutateAsync({ nip, password });

    toaster.promise(promise, {
      loading: {
        title: "A iniciar sessão...",
        description: "Por favor aguarde",
      },
      success: (data) => ({
        title: data?.user?.name ? `Bem-vindo, ${data.user.name}` : "Bem-vindo!",
        description: "Sessão iniciada com sucesso",
      }),
      error: (err) => ({
        title: "Falha no início de sessão",
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Algo correu mal",
      }),
    });

    try {
      await promise;
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login submission error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Falha no início de sessão";
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return {
    error,
    nip,
    password,
    isLoading: isPending,
    handleSubmit,
    setNip,
    setPassword,
    handleForgotPassword,
  };
}
