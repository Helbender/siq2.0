import { useAuth } from "@/features/auth/contexts/AuthContext";
import { useMemo, useState } from "react";
import { useUsersQuery } from "../queries/useUsersQuery";

export function useUsers() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading: loading, refetch } = useUsersQuery();

  const filteredUsers = useMemo(() => {
    // All users can see all users - no role-based filtering for viewing
    let visibleUsers = users;

    // Apply search filter if provided
    if (!searchTerm.trim()) {
      return visibleUsers;
    }

    const term = searchTerm.toLowerCase();
    return visibleUsers.filter((user) =>
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
  }, [searchTerm, users]);

  return {
    users,
    filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
    fetchUsers: refetch,
  };
}