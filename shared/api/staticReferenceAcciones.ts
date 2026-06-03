/** Acciones servidas desde el dump vía `GET /api/reference` (ver `lib/api/client.ts`). */
export const STATIC_REFERENCE_ACCIONES = new Set<string>([
    "RecuperarLineaPorCuandoLlega",
    "RecuperarCallesPrincipalPorLinea",
    "RecuperarInterseccionPorLineaYCalle",
    "RecuperarParadasConBanderaPorLineaCalleEInterseccion",
    "RecuperarParadasConBanderaYDestinoPorLinea",
    "RecuperarRecorridoParaMapaAbrevYAmpliPorEntidadYLinea",
    /** Resuelve calle + intersección para completar el formulario cuando ya hay `parada` (MGP). */
    "ResolverUbicacionFormularioPorParada",
]);
