import { Role } from "@common/roles";
import {
  FaCalendarCheck,
  FaDatabase,
  FaPlaneArrival,
  FaSearch,
  FaTable,
  FaTools,
  FaUsers,
} from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: MdSpaceDashboard, path: "/dashboard" },
  { label: "Voos", icon: FaPlaneArrival, path: "/flights" },
  { label: "Qualificações", icon: FaTable, path: "/crew-qualifications" },
  {
    label: "Qualificações a expirar",
    icon: FaCalendarCheck,
    path: "/qualifications-preview",
    minLevel: Role.USER,
  },
  //   { label: "Tabela de Qualificações", icon: FaTh, path: "/qualifications-table" },
  {
    label: "Gerir Qualificações",
    icon: FaTools,
    path: "/manage-qualifications",
    minLevel: Role.UNIF,
  },
  { label: "Utilizadores", icon: FaUsers, path: "/users" },
  {
    label: "Database Management",
    icon: FaDatabase,
    path: "/db-management",
    minLevel: Role.SUPER_ADMIN,
  },
  {
    label: "Pesquisar por tripulante",
    icon: FaSearch,
    path: "/flights/search-by-crew",
    minLevel: Role.SUPER_ADMIN,
  },
];
