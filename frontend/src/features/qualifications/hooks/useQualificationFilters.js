import { useEffect, useMemo, useState } from "react";

export function useQualificationFilters(qualifications) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [type, setType] = useState("all");

  // Single pass to derive both allGroups and allTypes
  const { allGroups, allTypes } = useMemo(() => {
    const groups = new Set();
    const types = new Set();
    for (const q of qualifications) {
      if (q.grupo) groups.add(q.grupo);
      if (q.tipo_aplicavel) types.add(q.tipo_aplicavel);
    }
    return { allGroups: [...groups], allTypes: [...types] };
  }, [qualifications]);

  const availableGroups = useMemo(() => {
    if (type === "all") return allGroups;
    const groups = new Set();
    for (const q of qualifications) {
      if (q.tipo_aplicavel === type && q.grupo) groups.add(q.grupo);
    }
    return [...groups];
  }, [type, qualifications, allGroups]);

  useEffect(() => {
    if (group !== "all" && !availableGroups.includes(group)) {
      setGroup("all");
    }
  }, [availableGroups, group]);

  // Single filter pass combining all conditions
  const filtered = useMemo(() => {
    const term = search ? search.toLowerCase() : null;
    return qualifications.filter(
      (q) =>
        (group === "all" || q.grupo === group) &&
        (type === "all" || q.tipo_aplicavel === type) &&
        (!term ||
          [q.nome, q.validade, q.tipo_aplicavel, q.grupo].some((f) =>
            f?.toString().toLowerCase().includes(term),
          )),
    );
  }, [qualifications, group, type, search]);

  return {
    search,
    setSearch,
    group,
    setGroup,
    type,
    setType,
    allTypes,
    availableGroups,
    filtered,
  };
}
