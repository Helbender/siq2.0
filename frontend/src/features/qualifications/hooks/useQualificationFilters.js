import { useEffect, useMemo, useState } from "react";

export function useQualificationFilters(qualifications) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [type, setType] = useState("all");

  const allGroups = useMemo(() => {
    return [...new Set(qualifications.map(q => q.grupo).filter(Boolean))];
  }, [qualifications]);

  const allTypes = useMemo(() => {
    return [...new Set(qualifications.map(q => q.tipo_aplicavel).filter(Boolean))];
  }, [qualifications]);

  const availableGroups = useMemo(() => {
    if (type === "all") return allGroups;

    return [
      ...new Set(
        qualifications
          .filter(q => q.tipo_aplicavel === type)
          .map(q => q.grupo)
          .filter(Boolean)
      ),
    ];
  }, [type, qualifications, allGroups]);

  useEffect(() => {
    if (group !== "all" && !availableGroups.includes(group)) {
      setGroup("all");
    }
  }, [availableGroups, group]);

  const filtered = useMemo(() => {
    let result = qualifications;

    if (group !== "all") {
      result = result.filter(q => q.grupo === group);
    }

    if (type !== "all") {
      result = result.filter(q => q.tipo_aplicavel === type);
    }

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(q =>
        [q.nome, q.validade, q.tipo_aplicavel, q.grupo]
          .some(f => f?.toString().toLowerCase().includes(term))
      );
    }

    return result;
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
