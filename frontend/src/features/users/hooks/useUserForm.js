import { useEffect, useState } from "react";

export function useUserForm(editingUser) {
  const [formData, setFormData] = useState({
    rank: "",
    nip: "",
    name: "",
    email: "",
    position: "Default",
    admin: false,
    squadron: "502 - Elefantes",
    tipo: "PILOTO",
    status: "Presente",
  });

  useEffect(() => {
    if (!editingUser) {
      setFormData({
        rank: "",
        nip: "",
        name: "",
        email: "",
        position: "Default",
        admin: false,
        squadron: "502 - Elefantes",
        tipo: "PILOTO",
        status: "Presente",
      });
      return;
    }

    setFormData({
      rank: editingUser.rank || "",
      nip: editingUser.nip || "",
      name: editingUser.name || "",
      email: editingUser.email || "",
      position: editingUser.position || "Default",
      admin: editingUser.admin || false,
      squadron: editingUser.squadron || "502 - Elefantes",
      tipo: editingUser.tipo || "PILOTO",
      status: editingUser.status || "Presente",
    });
  }, [editingUser]);

  return {
    formData,
    setFormData,
  };
}
