import { TipoTripulanteDefault } from "@/common/enums";
import { Role } from "@/common/roles";
import { useEffect, useState } from "react";

export function useUserForm(editingUser) {
  const [formData, setFormData] = useState({
    rank: "",
    nip: "",
    name: "",
    email: "",
    position: "Default",
    tipo: TipoTripulanteDefault.PILOTO,
    status: "Presente",
    roleLevel: Role.USER,
  });

  useEffect(() => {
    if (!editingUser) {
      setFormData({
        rank: "",
        nip: "",
        name: "",
        email: "",
        position: "Default",
        tipo: TipoTripulanteDefault.PILOTO,
        status: "Presente",
        roleLevel: Role.USER,
      });
      return;
    }

    setFormData({
      rank: editingUser.rank || "",
      nip: editingUser.nip || "",
      name: editingUser.name || "",
      email: editingUser.email || "",
      position: editingUser.position || "Default",
      tipo: editingUser.tipo || TipoTripulanteDefault.PILOTO,
      status: editingUser.status || "Presente",
      roleLevel: editingUser.roleLevel || editingUser.role?.level || Role.USER,
    });
  }, [editingUser]);

  return {
    formData,
    setFormData,
  };
}
