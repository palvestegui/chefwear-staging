# Instrucciones Persistentes del Proyecto (Azafrán Chefwear)

Este archivo es mi "Memoria a Largo Plazo". El sistema me obliga a leer esto automáticamente cada vez que inicio una sesión, antes de hacer cualquier cosa.

## 1. Reglas Estructurales (Regla 300/500)
- **Archivos Lógicos (Hooks, Utils, Contexts)**: Límite estricto de 300 líneas. Si se supera, DEBE ser modularizado.
- **Archivos Visuales (Components, Modals, Views)**: Límite estricto de 500 líneas.
- Nunca agregar código a un archivo que viole este límite sin antes refactorizar/separar.

## 2. Reglas del Motor de Precios y Modo Migración
- **Única Fuente de Verdad (Motor)**: Toda la lógica matemática de descuentos (Volumen, Contado, Paquetes UDI) vive EXCLUSIVAMENTE en `src/utils/pricingCalculator.ts`.
- **Modo Migración (migrationFlatDiscount)**: Si una orden tiene un `migrationFlatDiscount > 0`, se **SUSPENDEN y BLOQUEAN** absolutamente todas las reglas de descuentos automáticos. El sistema aplica única y exclusivamente el descuento manual de migración. El motor no debe intentar adivinar nada más.
- **Vistas "Tontas" (Dumb Views)**: Las tarjetas de UI, modales, PDF de recibos, el Reporte de Ventas y el Historial **NUNCA** deben recalcular descuentos o alterar el `totalPrice`. Deben limitarse a leer y renderizar matemáticamente el `totalPrice` y `amountCollected` que viene directo de la Base de Datos. 

## 3. Comentarios en el Código
- Todo cambio complejo en la lógica de negocio debe incluir un comentario claro (ej. `// MIGRATION OVERRIDE: ...`) para que mi "yo del futuro" entienda por qué se hizo esa excepción, en lugar de borrarla creyendo que es un error.
