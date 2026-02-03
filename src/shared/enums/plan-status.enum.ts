export enum PlanStatus {
  ACTIVE = 'active', // El plan se muestra en la web y se puede comprar.
  INACTIVE = 'inactive', // El plan está oculto (útil para planes en construcción).
  ARCHIVED = 'archived', // El plan ya no existe para la venta, pero las escuelas que ya lo compraron lo siguen usando (legacy).
  DELETED = 'deleted', // Eliminación lógica.
}
