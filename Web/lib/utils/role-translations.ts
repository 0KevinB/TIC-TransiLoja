/**
 * Traduce los roles del sistema al español
 */
export function translateRole(role: string): string {
  const roleTranslations: Record<string, string> = {
    admin: "Administrador",
    operator: "Operador",
    dispatcher: "Despachador",
    viewer: "Visualizador",
    user: "Usuario",
  }

  return roleTranslations[role] || role
}

/**
 * Verifica si un rol puede acceder al dashboard de administración
 */
export function canAccessDashboard(role: string): boolean {
  return role === "admin"
}
