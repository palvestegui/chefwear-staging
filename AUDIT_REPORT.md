# Comprehensive Codebase Diagnostic Audit Report

## Audit Overview
This document contains the raw technical evidence, exact file paths, line numbers, and violation categories identified during the structural health check of the application codebase.

---

## Detailed Violation Log

| Module / File Path | Issue Category | Specific Violation / Line Reference | Required Architectural Fix |
| :--- | :--- | :--- | :--- |
| `src/utils/pricingCalculator.ts` | Hardcoded Logic | Líneas 43-48: accountId === 'ACC-001' y clientType === 'Estudiante UDI' para asignar tiers. | Remover IDs quemados. Enlazar la asignación de pricingTier estrictamente a los atributos configurados en la DB. |
| `src/utils/pricingCalculator.ts` | Hardcoded Logic | Líneas 155-164: Mapeo manual a UDI Especial o verificación por nombre literal de la prenda (Uniforme Completo UDI). | Depender del flag isUdiGroup o de una propiedad del catálogo, en lugar de strings literales del nombre del ítem. |
| `src/utils/discountRulesUtils.ts` | Hardcoded Logic | Línea 51: presetKey === 'UDI Especial' | Reemplazar chequeos literales por evaluación dinámica de propiedades. |
| `src/utils/udiPackageUtils.ts` | Hardcoded Logic | Línea 22: export const DEFAULT_UDI_PRICES: Record<string, number> = { mandil: 155, ... } | Eliminar por completo. Extraer estos precios directamente del catálogo maestro de productos. |
| `src/hooks/useCRMMutations.ts` | Unlinked / Dead Code | Archivo completo. useCRMMutations no es importado ni consumido en ningún flujo principal. | Eliminar el archivo por completo para reducir deuda técnica. |
| `src/utils/accountContactUtils.ts` | Unlinked | Función syncOrphanedInstitutionalAccountsAndContacts declarada pero huérfana. | Purgar función o enlazar a una rutina de mantenimiento / Admin Panel. |
| `src/utils/orderUtils.ts` | Unlinked | Función checkQuoteMissingData nunca es llamada en el flujo de validación. | Eliminar función u obligar a las vistas de cotización a pasar por este orquestador. |
| `src/hooks/useCRMMutations.ts` | Hardcoded Logic | Línea 26: city: editingClient.city | Purgar archivo zombie junto con sus propiedades internas. |
| `src/utils/pdfGenerator.ts` | Type Risk | Múltiples firmas: (order: any, isOrder: boolean) | Reemplazar any por una interfaz robusta (Order o InvoiceContext) para prevenir crashes en generación de PDFs. |
| `src/utils/csvFormatters.ts` | Type Risk | Parámetros de iteración masiva marcados como any (filteredOrders: any[]). | Declarar contratos de tipos estrictos en la frontera de importación/exportación de CSV. |
| `src/utils/accountContactUtils.ts` | Anti-Pattern | Archivo de 339 líneas (Viola Regla 300). Mezcla lógica de utilidad pura con mutaciones directas de Firestore. | Separar rutinas puras (generadores de IDs) de las mutaciones, o mover a la capa useMutations. |
| `src/hooks/useOrderCreator.ts` | Anti-Pattern | Archivo de 331 líneas (Viola Regla 300). Monolito de orquestación. | Modularizar el hook en sub-hooks de estado (ej. useOrderState y useOrderSubmission). |