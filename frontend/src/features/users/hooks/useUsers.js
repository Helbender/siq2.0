import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useMemo, useState } from "react";
import { useUsersQuery } from "../queries/useUsersQuery";

export function useUsers() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading: loading, refetch } = useUsersQuery();

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      if (currentUser?.admin) {
        return users;
      } else {
        return users.filter((u) => u.nome === currentUser?.nome);
      }
    }

    if (currentUser?.admin) {
      const term = searchTerm.toLowerCase();
      return users.filter((user) =>
        [
          user.nip,
          user.name,
          user.position,
          user.tipo,
          user.status,
        ]
          .map((field) => (field ? field.toString().toLowerCase() : ""))
          .some((field) => field.includes(term)),
      );
    } else {
      return users.filter((u) => u.nome === currentUser?.nome);
    }
  }, [searchTerm, users, currentUser]);

  return {
    users,
    filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
    fetchUsers: refetch,
  };
}