import { Role } from "@/shared/roles";
import {
  FaDatabase,
  FaExclamationTriangle,
  FaPlaneArrival,
  FaSearch,
  FaTable,
  FaTools,
  FaUsers,
} from "react-icons/fa";
import { MdOutlineEventNote, MdSpaceDashboard } from "react-icons/md";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: MdSpaceDashboard, path: "/dashboard" },
  { label: "Briefing Diário", icon: MdOutlineEventNote, path: "/briefing" },
  { label: "Voos", icon: FaPlaneArrival, path: "/flights" },
  { label: "Qualificações", icon: FaTable, path: "/crew-qualifications" },
  // {
  //   label: "Qualificações a expirar",
  //   icon: FaCalendarCheck,
  //   path: "/qualifications-preview",
  //   minLevel: Role.USER,
  // },
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
  {
    label: "Anomalias",
    icon: FaExclamationTriangle,
    path: "/anomalias",
    minLevel: Role.USER,
  },
];
