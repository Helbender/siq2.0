// Map path to page title for TopBar
export const PATH_TITLES = {
  "/dashboard": "Dashboard",
  "/flights": "Voos",
  "/flights/search-by-crew": "Pesquisar por tripulante",
  "/crew-qualifications": "Qualificações",
  "/qualifications-preview": "Qualificações a expirar",
  "/manage-qualifications": "Gerir Qualificações",
  "/users": "Utilizadores",
  "/db-management": "Database Management",
  "/about": "About",
  "/briefing": "Briefing Diário",
  "/anomalias": "Anomalias de Aeronaves",
};

export function getPageTitle(pathname) {
  if (pathname === "/") return "Dashboard";
  for (const [path, title] of Object.entries(PATH_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "SIQ 2.0";
}
