import { http } from "@/api/http";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/contexts/AuthContext";

export function useUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await http.get("/users");
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filterUsers = () => {
      if (!searchTerm.trim()) {
        if (currentUser?.admin) {
          setFilteredUsers(users);
        } else {
          const results = users.filter((u) => u.nome === currentUser?.nome);
          setFilteredUsers(results);
        }
        return;
      }

      if (currentUser?.admin) {
        const term = searchTerm.toLowerCase();
        const results = users.filter((user) =>
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
        setFilteredUsers(results);
      } else {
        const results = users.filter((u) => u.nome === currentUser?.nome);
        setFilteredUsers(results);
      }
    };

    filterUsers();
  }, [searchTerm, users, currentUser]);

  return {
    users,
    filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
    fetchUsers,
  };
}