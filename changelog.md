## [Unreleased]
### Staging Backend Receiver 50MB Payload Expansion and Safe Catalog Merge (`server.ts`)
- **Body-Parser Limit Expansion**:
  - Expanded `express.json({ limit: "50mb" })` and added `express.urlencoded({ limit: "50mb", extended: true })` to prevent HTTP 413 Payload Too Large rejections during full 32-garment catalog synchronizations with high-resolution imagery and rich descriptions.
- **Route Aliases & Zero Data Loss Catalog Sync**:
  - Registered sync receiver handler across `/api/pricing/sync`, `/api/sync-to-ventas`, `/api/sync-pricing`, and `/sync`.
  - Enforced Firestore update with `{ merge: true }` on `pricing/global`, guaranteeing that existing `services`, `specialPresets` (UDI packages), and `discountRulesByTier` are never overwritten or dropped.
  - Dynamically configured CORS headers (`Access-Control-Allow-Origin: req.headers.origin || '*'`) allowing cross-origin requests from Azafrán Precios (`https://azafran-costos-precios.ai.studio`, `localhost`, etc.).
- **Architectural Compliance**:
  - `server.ts` maintained at 260 lines (< 300 lines limit, Rule 300).
  - Strict TypeScript with zero `any` additions and zero `@ts-ignore`.
  - Verified with `npx tsc --noEmit` and `compile_applet`.
### Strict Pre-Cart Modal Validation and Workshop Incomplete Order Badges (`GarmentConfigurator.tsx`, `orderItemConsolidation.ts`, `OperationsView.tsx`, `ProductionView.tsx`)
- **Strict Pre-Flight Validation Gates (`GarmentConfigurator.tsx`)**:
  - Gated `handleAddItem` with 4 mandatory field validations:
    * **Pocket Name**: Blocks adding garment if `Nombre en el bolsillo` is selected but `pocketName` is empty.
    * **Custom Pocket Specs**: Blocks adding garment if `Bolsillos personalizados` is selected but `customPocketDetails` is empty.
    * **Editable Service Prices**: Inspects applicable services and blocks if any editable/additional cost service lacks a defined numeric price in `customServicePrices`.
    * **Fabric Color**: Blocks adding garment in `Orden Activa` mode (non-UDI) if `fabricColor` is empty.
  - Zero Guessing Policy: Replaced silent fallback with explicit alert modals naming the exact missing field.
- **Explicit Workshop Incomplete Order Alert (`orderItemConsolidation.ts`)**:
  - In `resolveItemEmbroideries`, if `"Nombre en el bolsillo"` is present in services or embroideries but `pocketName` is empty, emits `⚠️ FALTA NOMBRE EN BOLSILLO (NO ESPECIFICADO)`.
- **Warning Badge Highlighting (`OperationsView.tsx` & `ProductionView.tsx`)**:
  - Styled badges beginning with `⚠️` using warning styling (`bg-red-950/60 border-red-500/40 text-red-400 font-black animate-ping indicator`), immediately alerting the workshop to pause and consult sales before cutting or embroidering.
- **Architectural Compliance**:
  - `GarmentConfigurator.tsx` (489 lines, Rule 500 compliant).
  - `orderItemConsolidation.ts` (183 lines, Rule 300 compliant).
  - `OperationsView.tsx` (351 lines, Rule 500 compliant).
  - `ProductionView.tsx` (486 lines, Rule 500 compliant).
  - `garmentMeasurementUtils.ts` (56 lines, Rule 300 compliant).
  - Strict TypeScript with zero `any` additions and zero `@ts-ignore`.
  - Verified with `npx tsc --noEmit` and `compile_applet`.
### Customer Pocket Name and Embroidery Visibility (`orderItemConsolidation.ts`, `OperationsView.tsx`, `ProductionView.tsx`)
- **Unified Embroidery & Pocket Name Resolver (`src/utils/orderItemConsolidation.ts`)**:
  - Exported `resolveItemEmbroideries` to extract and unify embroidery specifications from `item.embroideries`, `item.services` (e.g. "Nombre en el bolsillo" / "LOGO"), and `item.pocketName`.
  - Dynamically synthesizes `Nombre en bolsillo: [NOMBRE]` and deduplicates references across explicit arrays and services.
- **Operations View Enhancements (`src/components/views/OperationsView.tsx`)**:
  - Replaced raw `item.embroideries` checks with `resolveItemEmbroideries(i)` in both Desktop table view and Mobile card stack view.
  - Prominently styled pocket embroideries with animated amber bullet indicators (`bg-amber-400 animate-pulse font-extrabold text-amber-400`).
- **Production View Workshop Cards (`src/components/views/ProductionView.tsx`)**:
  - Updated "NOTAS & BORDADOS" in Desktop ledger and "Bordados Requeridos" in Mobile cards to leverage `resolveItemEmbroideries(item)`.
  - Pocket names and logo placements are clearly listed with amber badge highlights for workshop staff.
  - Consolidated measurement points definition into `getMeasurementPoints` to optimize line footprint.
- **Architectural Compliance**:
  - `src/utils/orderItemConsolidation.ts` at 177 lines (< 300 lines limit, Rule 300).
  - `src/components/views/OperationsView.tsx` at 315 lines (< 500 lines limit, Rule 500).
  - `src/components/views/ProductionView.tsx` at 473 lines (< 500 lines limit, Rule 500).
  - Strict TypeScript with zero `any` additions and zero `@ts-ignore`.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Garment-Aware Tailoring Measurement Cascading and Production Card Rendering (`garmentMeasurementUtils.ts`, `EditContactModal.tsx`, `ProductionView.tsx`)
- **Centralized Garment Classifiers (`src/utils/garmentMeasurementUtils.ts`)**:
  - Implemented single source of truth for tailored piece classification: `isUpperTailored` (Filipina, Chamarra, Camisa — 8 points), `isLowerTailored` (Pantalón — 4 points), `isBundleGarment` (Uniforme Completo UDI — 12 points), and `isTailored`.
  - Added `getMeasurementButtonLabel` and `getTailoredMeasurementCount` to dynamically compute labels (`8 Medidas`, `4 Medidas`, `12 Medidas`).
  - Ground truth terminology compliance: Outerwear jackets are strictly `Chamarra` and chef jackets are strictly `Filipina` (zero use of `chaqueta`).
- **Selective Measurement Cascading & Sanitization (`EditContactModal.tsx`)**:
  - In `handleSave`, tailored garments (upper, lower, bundle) selectively receive `sizingMatrix`.
  - Unitalla items (Mandil, Gorro, Delantal, Guardapolvo, Accesorios) are automatically sanitized by deleting `customMeasurements` and `measurements` before writing to Firestore.
- **Production Board View Guarding (`ProductionView.tsx`)**:
  - In `getGarmentSpecs`, guarded against non-tailored garments so unitalla pieces never compute `isCustom = true`.
  - On both Desktop ledger and Mobile cards, guarded the measurement toggle button strictly with `isTailored(item.name) && isCustom`.
  - Dynamically displays `[📐 8 Medidas]` for upper tailored pieces and `[📐 4 Medidas]` for pants.
  - Non-tailored unitalla pieces render a clean dash `—` under Talla / Medidas without measurement buttons or raw text dumps.
- **Architectural Compliance**:
  - `src/utils/garmentMeasurementUtils.ts` (29 lines, Rule 300 compliant).
  - `EditContactModal.tsx` (412 lines, Rule 500 compliant).
  - `ProductionView.tsx` (464 lines, Rule 500 compliant).
  - Zero `any` additions, zero `@ts-ignore`.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Two-Way Measurement Synchronization and Active Order Cascading (`EditContactModal.tsx`)
- **Canonical Measurement Points (`TAILORING_12_POINTS`)**:
  - Replaced the local 12 measurement keys array in `EditContactModal.tsx` with canonical `TAILORING_12_POINTS` imported from `src/utils/contactUtils.ts`.
  - Implemented sequential value resolution across `m.key`, `m.alt`, camelCase, stripped, and lowercased variants (`matrix[m.key] ?? (m.alt ? matrix[m.alt] : undefined) ?? matrix[camel] ?? matrix[stripped] ?? matrix[stripped.toLowerCase()] ?? ''`).
  - Synchronized bidirectional writes in `onChange` and re-linking actions, ensuring both prefixed keys (`F_Hombros`, `P_Cintura`) and alias keys (`hombros`, `cintura`) are stored in `sizingMatrix` and `sizingMatrix12PtCM`.
- **Active Production Order Cascading**:
  - Updated `handleSave` in `EditContactModal.tsx` to query all active orders (`Inventario Pendiente`, `Material Listo`, `En Confección`, `En Producción`, `Medidas Pendientes`, `Orden Activa`).
  - Matched customer orders by `contactId` or normalized customer name (`normalizeName`).
  - Concurrently cascaded the updated measurement matrix into order-level `sizingMatrix`, `sizingMatrix12PtCM`, and item-level `customMeasurements` and `measurements`.
- **Architectural Compliance**:
  - `EditContactModal.tsx` at 390 lines (< 500 lines limit, Rule 500).
  - Strict TypeScript with zero `any` additions and zero `@ts-ignore`.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Product Title Wrapping, A-Z Sorting, and Deterministic Primary Fabric Ordering (`MasterDetailPricingView.tsx`, `GarmentConfigurator.tsx`, `pricingResolver.ts`)
- **Left Sidebar Card Layout & Sorting (`MasterDetailPricingView.tsx`)**:
  - Refactored the garment card in the left rail to a 3-level vertical stack:
    * Line 1: Full product name with `text-sm font-bold text-amber-50 leading-snug whitespace-normal break-words` without truncation, wrapping cleanly when the sidebar narrows.
    * Line 2: Flex-wrap row with read-only SKU badge (`[ SKU: ... ]`) and category pill.
    * Line 3: Available fabrics count in `text-xs text-zinc-500 font-mono`.
  - Sorted the sidebar garments list strictly in alphabetical order (A-Z) using `localeCompare('es', { sensitivity: 'base' })`.
- **Deterministic Fabric Ordering (`MasterDetailPricingView.tsx`, `GarmentConfigurator.tsx`, `pricingResolver.ts`)**:
  - In `MasterDetailPricingView.tsx`, sorted the table fabric variants such that the Primary fabric (`isPrimary === true` or matching `defaultFabric`) is strictly at index 0 (Row 1), followed by all secondary fabrics sorted alphabetically.
  - Added `getSortedFabricsForGarment` to `pricingResolver.ts` to deterministically extract and sort available fabrics with the Primary fabric first.
  - In `GarmentConfigurator.tsx`, sorted the fabric dropdown options with Primary fabric first followed by alphabetical order, and explicitly set the default selected fabric to the Primary fabric upon garment selection or initialization.
- **Architectural Compliance**:
  - `MasterDetailPricingView.tsx` (298 lines), `pricingResolver.ts` (292 lines), `pricingCalculator.ts` (238 lines) strictly < 300 lines limit (Rule 300).
  - `GarmentConfigurator.tsx` (462 lines) strictly < 500 lines limit (Rule 500).
  - Zero `any` types, zero `@ts-ignore`.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Aggregated MCP Bundle and Alphanumeric SKU Resolution (`server.ts`, `pricingResolver.ts`, `MasterDetailPricingView.tsx`, `GarmentConfigurator.tsx`)
- **Aggregated MCP Tool (`staging_get_bundle`) in `server.ts`**:
  - Registered `staging_get_bundle` in `tools/list` schema.
  - Implemented concurrent retrieval using `Promise.all` across `pricing/global`, active orders (`status != 'Cancelado'`), and quotes collection.
  - Returns structured audit bundle `{ pricing, orders, quotes, summary: { activeOrdersCount, quotesCount, lastSyncedAt } }`.
- **Type Definitions (`src/types/index.ts`, `src/types/pricing.ts`)**:
  - Added `sku?: string` and `fabricSku?: string` to `OrderItem`, `FabricVariantPricing`, `FabricVariant`, `PricingGarment`, `CatalogGarmentEntry`, and `CatalogGarmentPricing`.
- **Master-Detail Pricing UI (`MasterDetailPricingView.tsx`, `CatalogPricingTab.tsx`, `BasePricingTab.tsx`)**:
  - Rendered read-only pill badge `[ SKU: {item.sku} ]` beside the garment title in the right detail header.
  - Rendered `item.sku` beside the garment name in the left sidebar list.
  - Rendered `fabricSku` tag for each variant in the fabric matrix table.
  - Updated `CatalogPricingTab` and `BasePricingTab` to map `sku` and `fabricSku` from incoming pricing records.
- **Resilient Pricing Resolver (`src/domains/pricing/pricingResolver.ts`)**:
  - Implemented SKU-first lookup matching `sku` and `fabricSku` in catalog and garments dictionaries.
  - Retained exact normalized name fallback matching, ensuring zero calculation drift for legacy orders (#ORD-00001 through #ORD-00026).
  - Delegated `getGarmentPriceValue` in `pricingCalculator.ts` and `usePricingEngine.ts` to the unified resolver.
- **Order Stamping (`GarmentConfigurator.tsx`)**:
  - Wired `findGarmentMetadata` into garment and fabric selection handlers to stamp `sku` and `fabricSku` directly onto draft `OrderItem`s.
- **Architectural Compliance**:
  - `server.ts` (255 lines), `pricingResolver.ts` (220 lines), `MasterDetailPricingView.tsx` (284 lines), `pricingCalculator.ts` (237 lines), `types/index.ts` (283 lines) strictly < 300 lines limit (Rule 300).
  - `GarmentConfigurator.tsx` (458 lines) strictly < 500 lines limit (Rule 500).
  - Zero `any` types, zero `@ts-ignore`.
  - Verified live via MCP curl call and compilation check (`tsc --noEmit`, `compile_applet`).
### Enforce Strict Single Primary Fabric & Eliminate Double Star Glitch (`BasePricingTab.tsx`, `MasterDetailPricingView.tsx`)
- **BasePricingTab Cleanup**:
  - Removed all hardcoded `defaultFabric` strings from `WORKSHOP_GARMENT_METADATA`, relying 100% on the synchronized `isPrimary` flag sent by Azafrán Precios.
  - Resolved `primary` strictly via `variants.find(v => v.isPrimary) || variants[0]`, eliminating artificial fallback collisions.
- **MasterDetailPricingView Table Badge Lock**:
  - In the table body, locked `isMain` strictly to identity with `primaryVariant` (`isMain = primaryVariant ? v.fabricName === primaryVariant.fabricName : false`).
  - Guarantees that only exactly one variant can ever be rendered with the `★ Principal` badge, permanently eliminating duplicate primary fabric tags.
- **Architectural Compliance**:
  - `BasePricingTab.tsx` reduced to 96 lines (<300 lines limit, Rule 300).
  - `MasterDetailPricingView.tsx` at 282 lines (<300 lines limit, Rule 300).
  - Zero `any` types throughout.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Add Pricing Sync Ingestion Endpoint with CORS (`server.ts`)
- **CORS Middleware Enhancement**:
  - Configured full cross-origin headers (`Access-Control-Allow-Origin: *`, methods `GET, POST, OPTIONS`, headers `Origin, X-Requested-With, Content-Type, Accept, Authorization`).
  - Returns `200 OK` on preflight `OPTIONS` requests to eliminate browser preflight blocks.
- **Direct Pricing Ingestion Route (`POST /api/pricing/sync`)**:
  - Validates incoming payloads requiring either `garments` or `catalogGarments`.
  - Merges into `pricing/global` Firestore document with `lastSyncedAt: Date.now()`.
  - Returns JSON response with `success: true`, message, and `updatedAt` timestamp.
- **Architectural Compliance**:
  - `server.ts` at 225 lines (<300 lines limit, Rule 300).
  - Zero `any` types throughout.
  - Verified live via `curl` for CORS preflight and validation responses.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Strip Fabric Consumption Figures & Enforce Strict Tela Principal Binding (`MasterDetailPricingView.tsx`, `CatalogPricingTab.tsx`, `BasePricingTab.tsx`)
- **MasterDetailPricingView Cleanup**:
  - Completely stripped all workshop consumption metrics: removed `consumptionMeters` from `MasterDetailPricingItem`, deleted `Scissors` icon import, and deleted the right canvas header badge `Consumo: X m/u`.
  - In left rail card, removed `Xm` indicator and rendered strictly: `<span>{item.variants.length} telas disponibles</span>`.
  - Right canvas header displays only garment name, category badge, and description.
  - Enforced strict `primaryVariant` resolution preferring `v.isPrimary === true`, then fallback to `v.fabricName === activeItem.defaultFabric`, and finally `activeItem.variants[0]`.
- **CatalogPricingTab Update**:
  - Full support for `pricing.catalogGarments` delivered either as a dictionary or array.
  - Mapped `isPrimary: Boolean(val?.isPrimary)`.
  - Omitted all consumption numbers from catalog item mapping.
- **BasePricingTab Update**:
  - Mapped `isPrimary: Boolean(val?.isPrimary)` from `pricing.garments`.
  - Automatically matches default fabric (e.g. Drill 8oz for Gorro) when explicit flags are absent, highlighting true canonical fabric as `[★ TELA PRINCIPAL]` instead of the first alphabetical key.
  - Stripped all workshop consumption metrics.
- **Architectural Compliance**:
  - `MasterDetailPricingView.tsx` (282 lines), `CatalogPricingTab.tsx` (125 lines), `BasePricingTab.tsx` (119 lines) all strictly under 300 lines limit (Rule 300).
  - Zero `any` types throughout.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Fix Catalog Reset Action in Staging Maintenance (`maintenanceUtils.ts`, `StagingMaintenanceView.tsx`)
- **Root Cause Resolution**:
  - `resetCatalogPricing` in `src/utils/maintenanceUtils.ts` only cleared `garments: {}` and `catalog: []` with `{ merge: true }`, failing to clear `catalogGarments` which is where **Ajustes > Catálogo** (`CatalogPricingTab.tsx`) reads and displays master catalog items. Added `catalogGarments: {}` to the reset payload.
  - `executeResetCatalog` in `src/components/views/settings/StagingMaintenanceView.tsx` previously did not notify the local React state via `updatePricingState`. Added a post-reset snapshot read and state dispatch (`updatePricingState?.(snap.data() as PricingData)`) so that the UI immediately updates without requiring a manual browser reload.
- **Architectural Compliance**:
  - `maintenanceUtils.ts` at 77 lines (<300 lines limit).
  - `StagingMaintenanceView.tsx` at 295 lines (<500 lines limit).
  - Zero `any` types. Verified with `tsc --noEmit` and `compile_applet`.
### Cleanly Replace Garments and CatalogGarments in staging_update_pricing_matrix (`server.ts`)
- **Stale Key Prevention via Direct Replacement**:
  - Refactored `staging_update_pricing_matrix` handler in `server.ts` to first fetch the current `pricing/global` document snapshot.
  - Replaces `currentData.garments` and `currentData.catalogGarments` directly when present in incoming arguments instead of deep-merging subkeys, preventing deleted or renamed garment keys from persisting.
  - Updates `lastSyncedAt: Date.now()` and saves the entire clean state via `setDoc(docRef, currentData)`.
- **Architectural Compliance**:
  - Single file implementation in `server.ts` (189 lines), strictly complying with Rule 300 (<300 lines limit).
  - Zero `any` types throughout.
  - Verified live via JSON-RPC 2.0 tool call over HTTP.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Implement staging_update_pricing_matrix MCP Tool in server.ts (`server.ts`)
- **Added `staging_update_pricing_matrix` Tool**:
  - Registered in `tools/list` schema with documentation for `garments` (multi-fabric pricing dictionary: `{ [garment]: { [fabric]: { priceRaleo, priceB2B } } }`) and `catalogGarments` (array of finished catalog garments pinned to default fabrics).
  - Configured higher Express payload limit (`express.json({ limit: "5mb" })`) to accommodate large catalog matrix updates.
  - Implemented in `tools/call` using `setDoc(doc(db, "pricing", "global"), updatePayload, { merge: true })`, preserving existing services, UDI covenants, and metadata while updating `lastSyncedAt`.
- **Architectural Compliance**:
  - Single file implementation in `server.ts` (191 lines), strictly adhering to Rule 300 (<300 lines limit).
  - Zero `any` types throughout.
  - Verified live via JSON-RPC `tools/list` and `tools/call` over HTTP.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Update server.ts to use Client Firestore (`server.ts`, `src/firebase.ts`)
- **Migrated to Web SDK Firestore**:
  - Replaced `firebase-admin` imports with client Firestore SDK (`collection`, `doc`, `getDoc`, `getDocs`, `setDoc` from `firebase/firestore`).
  - Imported initialized `db` singleton from `src/firebase.ts`.
  - Resolved GCP environment permission boundary issues (`PERMISSION_DENIED: Missing or insufficient permissions`) by reusing the client Firebase configuration.
- **Protocol Verification**:
  - `staging_get_pricing`: Reads `pricing/global` document snapshot via client SDK.
  - `staging_get_orders`: Reads all documents from `orders` collection.
  - `staging_get_quotes`: Reads all documents from `quotes` collection.
  - `staging_pull_precios_config`: Connects to `config/system-wide-config` and writes snapshot to `pricing/global`.
- **Architectural Compliance**:
  - Single file implementation in `server.ts` (173 lines), strictly conforming to Rule 300 (<300 lines).
  - Zero `any` types throughout.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Implement HTTP JSON-RPC MCP Server at /mcp in server.ts (`server.ts`)
- **JSON-RPC 2.0 MCP Protocol Implementation**:
  - Implemented direct HTTP JSON-RPC 2.0 endpoint at `/mcp` (GET for status/health ping, POST for JSON-RPC dispatcher).
  - Added permissive CORS middleware allowing `*` origins, `GET, POST, OPTIONS` methods, and `Content-Type, Authorization` headers with 204 OPTIONS preflight for Gemini MCP connector compatibility.
- **Protocol Methods**:
  - `initialize`: Returns protocolVersion `2024-11-05`, tools capability, and serverInfo (`name: "azafran-ventas-staging"`, `version: "1.0.0"`).
  - `notifications/initialized`: Responds with HTTP 200 `{}`.
  - `tools/list`: Exposes metadata schemas for `staging_get_pricing`, `staging_get_orders`, `staging_get_quotes`, and `staging_pull_precios_config`.
  - `tools/call`: Executes Staging Firestore tool calls and serializes formatted JSON content with standard JSON-RPC error encapsulation.
- **Architectural Compliance**:
  - Single file implementation in `server.ts` (178 lines), strictly conforming to Rule 300 (<300 lines).
  - Zero `any` types throughout request interfaces and data pipelines.
  - Clean verification with `tsc --noEmit` and `compile_applet`.
### Implement Staging MCP Server in server.ts (`server.ts`, `@modelcontextprotocol/sdk`)
- **Model Context Protocol (MCP) Server Integration**:
  - Integrated `@modelcontextprotocol/sdk` into `server.ts` alongside Vite dev server.
  - Instantiated `McpServer` named `"AzafranVentasStagingMCP"` (v1.0.0).
  - Configured SSE transport with `/sse` endpoint and `/messages` POST handler for client interactions.
- **Registered Staging Tools**:
  - `staging_get_pricing`: Inspects current `pricing/global` Firestore document.
  - `staging_get_orders`: Lists all active staging orders from Firestore.
  - `staging_get_quotes`: Lists all active staging quotes from Firestore.
  - `staging_pull_precios_config`: Reads `config/system-wide-config` from Precios and populates Staging `pricing/global` with `{ merge: true }` preserving services and UDI presets.
- **Architectural Compliance**:
  - Strictly adhering to Rule 300 (<300 lines limit for logical files; `server.ts` is 127 lines).
  - Zero `any` types across all tool handlers and server routines.
  - Fixed dev server binding to port 3000 to maintain compatibility with iframe preview.
  - Verified with `tsc --noEmit` and `compile_applet`.
### Add "Sincronizar desde Precios" Button in Staging Maintenance (`StagingMaintenanceView.tsx`, `MaintenanceActionCard.tsx`, `DataContext.tsx`, `maintenanceUtils.ts`)
- **"Sincronizar desde Precios" Action Button**:
  - Added a prominent, amber-accented action button labeled **`"SINCRONIZAR DESDE PRECIOS"`** with download icon inside the "Catálogo de Precios" card of `StagingMaintenanceView.tsx`.
  - Positioned directly above the empty/reset button, keeping `BasePricingTab.tsx` and `CatalogPricingTab.tsx` clean and untampered.
- **Handler Implementation (`handleSyncFromPrecios`)**:
  - Pulls the fresh `pricing/global` document snapshot directly from Firestore.
  - Updates local pricing state across `DataContext` via `setPricing(data)`, ensuring immediate synchronization across **`TARIFARIO BASE`** and **`CATÁLOGO`** views upon navigation.
  - Features real-time animated loading state `<Loader2 className="w-4 h-4 animate-spin" />` while syncing.
  - Emits the visual feedback banner at the top of the panel and displays the emerald success toast: `✓ Tarifario y Catálogo sincronizados con éxito desde Precios`.
- **Architectural Modularization & Rule 300 Strict**:
  - Created `src/utils/maintenanceUtils.ts` (82 lines) to encapsulate Firestore purge batches, catalog resets, and staging data initialization.
  - Extended `MaintenanceActionCard.tsx` (108 lines) with `topAction` prop to accommodate multi-action cards cleanly.
  - Refactored `StagingMaintenanceView.tsx` to 291 lines, strictly respecting Rule 300 (< 300 lines limit).
  - 100% strict TypeScript types with zero `any`, verified with `tsc --noEmit`.
### Restore Canonical Services & UDI and Safe Merge in Staging Maintenance (`StagingMaintenanceView.tsx`, `MaintenanceActionCard.tsx`)
- **Canonical Services & UDI Restoration Button**:
  - Imported `canonicalData` from `src/data/canonicalServicesAndUdi.json` containing the official, complete catalog of services, special presets (`UDI Especial`), and UDI item price matrices.
  - Added dedicated maintenance card and action button **"RESTAURAR SERVICIOS Y UDI"** executing `setDoc(doc(firestore, "pricing", "global"), canonicalData, { merge: true })`.
  - Configured inline two-step confirmation (`confirmingAction === 'services'`) with confirmation prompt `"⚠️ SÍ, RESTAURAR AHORA"`.
- **Safe Reset with Merge Protection**:
  - Updated `executeResetCatalog` to explicitly pass `{ merge: true }` to `setDoc(doc(firestore, "pricing", "global"), { garments: {}, catalog: [], version: 0, updatedAt: Date.now() }, { merge: true })`.
  - Guaranteed that resetting the garment catalog will never inadvertently purge or destroy existing services, special presets, or UDI pricing rules.
- **Rule 300 / 500 & Strict Type Safety**:
  - Typed `MaintenanceActionKey = 'catalog' | 'services' | 'orders' | 'total'`.
  - Maintained `StagingMaintenanceView.tsx` (288 lines) and `MaintenanceActionCard.tsx` (96 lines) strictly under the 300-line limit for logical/modular files.
  - Zero `any` types and clean TypeScript compilation (`tsc --noEmit`).
### Fix Staging Maintenance Buttons: Inline Two-Step Confirmation (`StagingMaintenanceView.tsx`, `MaintenanceActionCard.tsx`)
- **Root Cause Diagnosis**:
  - `window.confirm()` and `window.alert()` calls were blocked by browser iframe sandboxing in web previews, causing maintenance buttons (`handleResetCatalog`, `handlePurgeQuotesAndOrders`, `handleFactoryReset`) to fail silently before setting loading state or reaching Firestore.
- **Inline Two-Step Confirmation System**:
  - Completely purged all `window.confirm()` and `window.alert()` invocations across the maintenance panel.
  - Implemented reactive `confirmingAction: 'catalog' | 'orders' | 'total' | null` state.
  - Standard button click now reveals a high-visibility inline confirmation cluster ("⚠️ SÍ, VACIAR AHORA" / "Cancelar") without relying on browser dialogs.
- **Execution Handlers & Dual Reset**:
  - `executeResetCatalog`: Resets `pricing/global` to `{ garments: {}, catalog: [], version: 0, updatedAt: Date.now() }` and additionally cleans legacy `settings/pricing` if present.
  - `executePurgeQuotesAndOrders`: Batched deletion of `quotes`, `orders`, `orderItems`, `orderModifiers`.
  - `executeFactoryReset`: Full staging reset preserving protected seed accounts `ACC-000`, `ACC-001`, and `CON-001`, re-running `runSeedUDI(...)` immediately after.
- **Feedback & Visual Polish**:
  - Added dedicated inline feedback banner displaying `successMessage` at the top of the panel with emerald styling.
- **Architecture & Rule 300 Compliance**:
  - Extracted reusable `MaintenanceActionCard.tsx` (89 lines), bringing `StagingMaintenanceView.tsx` to 278 lines (<300 lines limit).
  - 100% strict TypeScript types with zero `any`. Build compiles cleanly (`tsc --noEmit`).
### Split "Tarifario Base" vs "Catálogo" Submenus & Staging Maintenance Catalog Reset Fix (`SettingsView.tsx`, `BasePricingTab.tsx`, `CatalogPricingTab.tsx`, `StagingMaintenanceView.tsx`, `SidebarNav.tsx`, `MainLayout.tsx`, `App.tsx`, `PricesView.tsx`)
- **Removal of Redundant Top Tab Bar**:
  - Removed top dual-tab pill switcher (`[ Catálogo Maestro | Tarifario Base (Taller) ]`) from `SettingsView.tsx`. Tab A and Tab E now render independently as distinct submenus.
- **Dedicated Submenus**:
  - **Submenu `TARIFARIO BASE` (Tab A)**: Displays strictly workshop patterns (Filipina, Delantal, Pantalón, Gorro, Camisas, Guardapolvos, Chamarras, Accesorios). Title banner: `TARIFARIO BASE DE TALLER` with garment count metric. Filter pills: `Todas`, `Filipinas`, `Mandiles`, `Pantalones`, `Gorros`, `Chamarras`, `Accesorios`. Filtered out all commercial catalog garments.
  - **Submenu `CATÁLOGO` (Tab E)**: Displays strictly commercial collection garments from `catalogGarments`. Removed standard workshop garments fallback. Title banner: strictly `CATÁLOGO`. Filter pills: `Todas`, `Filipinas`, `Mandiles Botánica`, `Mandiles Especiales`, `Chamarras`.
- **Repair of "Restablecer / Vaciar Catálogo" in `StagingMaintenanceView.tsx`**:
  - Directly imported `db` from `../../../firebase`, resolving prop-drilling unresponsiveness.
  - Implemented `handleResetCatalog` with explicit `window.confirm()`, dedicated `isResettingCatalog` loading state with `<Loader2 className="animate-spin" />`, overwriting `pricing/global` with `{ garments: {}, catalog: [], version: 0, updatedAt: Date.now() }`.
  - Added success and error feedback with emerald toast `✓ Catálogo de precios vaciado con éxito` and `onNotify` callback.
- **Routing & Navigation Alignment**:
  - Updated `SidebarNav.tsx`, `App.tsx`, and `MainLayout.tsx` to cleanly route `activeTab === 'tarifario'`, `activeTab === 'catalogo'`, and `activeTab === 'mantenimiento'`, keeping `isAjustesActive` synchronized.
- **Rule 300 / Rule 500 & Type Safety**:
  - Replaced `any` in `PricesView.tsx` with `PriceReferenceProps['pricing']`.
  - All files strictly adhere to Rule 300/500 line limits and compile cleanly with `tsc --noEmit`.
### Dedicated "Mantenimiento" Submenu under Ajustes with Protected Seed Accounts (`src/components/views/settings/StagingMaintenanceView.tsx`, `src/components/layout/SidebarNav.tsx`, `src/components/views/SettingsView.tsx`, `src/components/layout/MainLayout.tsx`, `src/App.tsx`, `src/utils/crmSeedUtils.ts`)
- **Navigation & Submenu Integration (`SidebarNav.tsx`, `MainLayout.tsx`, `App.tsx`, `SettingsView.tsx`)**:
  - Added new `Mantenimiento` sub-navigation option with `Wrench` icon directly under `Roles & Usuarios` in `SidebarNav.tsx`.
  - Updated `settingsTab` state union across `App.tsx`, `SidebarNav.tsx`, `MainLayout.tsx`, and `SettingsView.tsx` to support `'mantenimiento'`.
  - Configured top-bar breadcrumb `Ajustes · Mantenimiento` in `MainLayout.tsx`.
- **Staging Maintenance & Data Purging Component (`StagingMaintenanceView.tsx`)**:
  - Engineered dark-themed maintenance panel (257 lines, adhering strictly to Rule 300 <300 lines limit).
  - **Catálogo de Precios**: Implemented action button to reset and empty `pricing/global` Firestore document to `{ garments: {}, catalog: [], version: 0 }`.
  - **Cotizaciones y Pedidos de Prueba**: Batched deletion of `quotes`, `orders`, `orderItems`, and `orderModifiers` in 400-document Firestore write batches.
  - **Reinicio Completo (Factory Reset Staging)**: Comprehensive staging purge with **critical safeguards**:
    - Strictly preserves core directory accounts `ACC-000` ("Cliente Particular") and `ACC-001` ("Universidad UDI") in `clientAccounts` and `accounts`.
    - Strictly preserves core contact `CON-001` ("Matias Peñaranda") in `masterContacts`.
    - Automatically invokes `runSeedUDI(db, user, [], true)` immediately post-purge to guarantee core accounts remain 100% active and healthy.
- **Safety, Feedback & Compliance**:
  - Every action requires explicit `window.confirm()` before executing.
  - Buttons are disabled with animated `Loader2` spinners while async operations execute.
  - Displays emerald toast on completion: `✓ Datos de staging purgados (ACC-000 y ACC-001 preservados)`.
  - Zero `any` and 100% strict TypeScript types.

### Two-Column Master-Detail Consumers in Settings (`src/components/views/settings/CatalogPricingTab.tsx`, `src/components/views/settings/BasePricingTab.tsx`, `src/components/views/SettingsView.tsx`)
- **Master-Detail Wiring in Settings**:
  - Wired `CatalogPricingTab.tsx` to `MasterDetailPricingView` with support for multi-fabric author collections (`Colección de Autor`) and fallback to standard garments (111 lines, < 300 lines limit).
  - Refactored `BasePricingTab.tsx` into a read-only Master-Detail presentation component with canonical workshop garment metadata and synchronized pricing (80 lines, < 300 lines limit).
  - Integrated Tab A sub-selector in `SettingsView.tsx` enabling seamless toggle between **Catálogo Maestro** and **Tarifario Base (Taller)** with dedicated iconography and active pill states (219 lines, < 300 lines limit).
- **Strict Compliance & Zero 'any'**:
  - Eliminated legacy `any` types across settings pricing components, introducing strict `SettingsPricingInput` and `CatalogGarmentRecord` interfaces.
  - All files strictly adhere to Rule 300 (<300 lines) and strict TypeScript compilation (`tsc --noEmit` clean).

### Reusable Master-Detail Presentation Component (`src/components/pricing/MasterDetailPricingView.tsx`)
- **Master-Detail Layout Architecture**:
  - Created reusable, high-density Master-Detail presentation component (`MasterDetailPricingView.tsx`) adhering strictly to Rule 300 (<300 lines; 298 lines).
  - Left Rail (Master): Collapsible search filter by garment name or fabric, category pills navigation (`Todas`, `Filipinas`, `Mandiles Botánica`, `Mandiles Especiales`, `Chamarras`), garment count metric, and scrollable selectable garment list with consumption and variant badges.
  - Right Canvas (Detail): Detailed garment header with consumption badge (`m/u`), featured `[★ Tela Principal]` highlight banner with real-time minorista/B2B pricing, and commercial 3-column table displaying full fabric variant catalog with synchronized read-only prices.
- **Strict Compliance & Type Safety**:
  - Full TypeScript safety with dedicated interfaces (`PricingVariant`, `MasterDetailPricingItem`, `MasterDetailPricingViewProps`).
  - Zero usage of `any` or `@ts-ignore`.
  - Zero hardcoding and pure presentation logic driven by input props.

### Multi-Fabric Support for Catálogo de Prendas (`src/types/pricing.ts`, `src/types/index.ts`, `src/components/views/settings/CatalogPricingTab.tsx`)
- **Type Definitions (`CatalogGarmentPricing`)**:
  - Extended `CatalogGarmentPricing` in `src/types/pricing.ts` with `fabricVariants?: Record<string, { priceRaleo: number; priceB2B: number }>;`.
  - Re-exported `CatalogGarmentPricing` explicitly from `src/types/index.ts`.
- **Multi-Fabric Card Presentation in Catálogo (`CatalogPricingTab.tsx`)**:
  - Replaced single-fabric cards with structured multi-fabric view matching Tarifario Base depth.
  - Added `[★ Tela Principal]` highlight showcase displaying primary fabric with PVP Minorista and B2B pricing.
  - Added sub-section displaying all authorized variants in `fabricVariants`, highlighting the main fabric and showing `RALEO (Bs)` and `B2B (Bs)` with scrollable container for multi-variant models.
  - Enhanced search filtering across name, fabric, category, description, and variant fabric names.
- **Sync Overwrite & Clean Purge**:
  - `handlePullFromPrecios` ingests full multi-fabric configurations and base workshop garments via atomic `updateDoc`, with detailed alert reporting model count and base garments.
- **Rule 300 / 500 Compliance & Strict Type Safety**:
  - `CatalogPricingTab.tsx` kept strictly at 270 lines (< 300 lines limit).
  - Zero usage of `any` or `@ts-ignore`.

### Fix Catalog Sync Clean Overwrite (`CatalogPricingTab.tsx`)
- **Purge Ghost Records on Sync**:
  - Replaced merging behavior in `handlePullFromPrecios` with atomic `updateDoc` targeting `pricing/global`.
  - Overwrites `catalogGarments` and `garments` completely with incoming data from Azafrán Precios rather than shallow merging, ensuring deleted items are cleanly purged.
- **Rule 300 / 500 Compliance & Type Safety**:
  - `CatalogPricingTab.tsx` maintained at 237 lines (< 300 lines limit).
  - Strict type checking with zero usage of `any` or `@ts-ignore`.

### Reset Ventas Staging Pricing to Pristine Clean State (`CatalogPricingTab.tsx`, `scripts/resetCleanPricing.ts`)
- **Restoration of Pristine Staging State**:
  - Reverted `garments` strictly to the 8 canonical workshop base garments (`Camisa de servicio (mesas)`, `Chamarra Aventurera`, `Chamarra Ecuestre personalizada`, `Filipina`, `Gorro`, `Mandil`, `Pantalón`, `Regulador para correas cruzadas`).
  - Completely removed `catalogGarments` using `deleteField()`, returning the Catálogo menu to its pristine empty state ("0 items / No hay productos de catálogo sincronizados aún").
  - Preserved `specialPresets` (UDI Especial), `services` (50 tailoring services), and `discountRulesByTier` completely intact in `pricing/global`.
- **UI Reset Control (`CatalogPricingTab.tsx`)**:
  - Added dedicated `[ 🧹 Restablecer a Estado Limpio ]` action button in the header toolbar of `CatalogPricingTab`.
  - Implemented `handleResetToCleanState` clearing merged non-canonical garment entries and executing atomic reset to base workshop garments.
- **Rule 300 / Rule 500 & Strict Type Safety**:
  - `CatalogPricingTab.tsx` maintained at 234 lines (< 250 lines target, < 300 lines limit).
  - Zero usage of `any` or `@ts-ignore`.

### Subscriber Bridge: Pull Pricing Snapshot from Azafrán Precios (`src/components/views/settings/CatalogPricingTab.tsx`, `src/components/settings/settings/CatalogPricingTab.tsx`)
- **Direct Subscriber Pull Integration**:
  - Implemented secondary Firebase applet connection targeting Azafrán Precios Firestore (`projectId: "gen-lang-client-0346242663"`, `firestoreDatabaseId: "ai-studio-fa1e6918-be9a-4562-bfc7-e531579774e7"`).
  - Added `handlePullFromPrecios` to fetch canonical snapshot document `pricing/global` published by Azafrán Precios.
  - Safely commits `catalogGarments` and `garments` directly into Ventas Firestore `pricing/global` using `{ merge: true }`, setting `lastSyncedAt: Date.now()` and `syncedFromPreciosAt: ISO string`.
- **UI Feedback & Controls**:
  - Added prominent `[ 🔄 Sincronizar desde Azafrán Precios ]` button to the header and empty-state card in `CatalogPricingTab`.
  - Added active state disabling button and displaying `"Sincronizando..."` with alerts for missing source catalog or sync errors.
- **Rule 300 / Rule 500 & Strict Type Safety**:
  - `CatalogPricingTab.tsx` maintained under 240 lines (< 300 lines).
  - Strict TypeScript compliance with zero usage of `any` or `@ts-ignore`.

### Catálogo de Prendas Support in Ventas & Tarifario (`types`, `SidebarNav.tsx`, `MainLayout.tsx`, `SettingsView.tsx`, `CatalogPricingTab.tsx`, `PriceReference.tsx`)
- **Types Extension (`src/types/pricing.ts`, `src/types/index.ts`)**:
  - Defined `CatalogGarmentPricing` interface covering `priceRaleo`, `priceB2B`, `fabric`, `consumptionMeters`, `description`, `category`, and `imageUrl`.
  - Extended `PricingData` with optional `catalogGarments?: Record<string, CatalogGarmentPricing>;`.
- **Navigation & Layout Integration (`SidebarNav.tsx`, `MainLayout.tsx`, `App.tsx`)**:
  - Added new vertical menu item under `AJUSTES` in `SidebarNav.tsx` labeled "Catálogo" (`id: 'E'`) positioned between Descuentos and Roles & Usuarios.
  - Updated `settingsTab` union in `SidebarNav.tsx`, `MainLayout.tsx`, `SettingsView.tsx`, and `App.tsx` to include `'E'`.
  - Added breadcrumb handling in `MainLayout.tsx` for `settingsTab === 'E'` returning `'Ajustes · Catálogo'`.
- **Settings Subcomponent (`CatalogPricingTab.tsx`)**:
  - Implemented `CatalogPricingTab` under 170 lines with search filtering, rendering PVP Minorista (Bs) in amber badges, Tarifa B2B (Bs) in stone badges, and fabric/description/consumption specs.
  - Implemented friendly empty state: `"No hay productos de catálogo sincronizados aún. Se actualizarán mediante el sincronizador de Azafrán Precios."`.
- **Dual-Mode Tarifario (`PriceReference.tsx`, `CatalogReferenceCards.tsx`)**:
  - Added compact segmented switcher in `PriceReference.tsx` toggling between `"Tarifario Base"` and `"Catálogo"`.
  - When in `"base"` mode, renders existing workshop garment cards and UDI special preset breakdown.
  - When in `"catalogo"` mode, renders modularized `CatalogReferenceCards.tsx` with real-time search filtering across name, fabric, category, and description.
- **Architectural & Quality Compliance**:
  - Enforced Firestore write safety with `{ merge: true }` in `useSettingsMutations.ts`.
  - Strict Rule 300 / Rule 500 compliance across all touched files (all files < 300 or < 500 lines).
  - Zero usage of `any` in new code, verified clean build with `tsc --noEmit` and `compile_applet`.

### Seed Staging Firestore with Live Pricing Configuration (`scripts/seedLivePricing.ts`, `src/live_pricing_global.json`)
- **Canonical Pricing Synchronization (`scripts/seedLivePricing.ts`)**:
  - Implemented standalone executable TypeScript seed script `scripts/seedLivePricing.ts`.
  - Directly seeded Staging Firestore document `pricing/global` with canonical live pricing catalog from `src/live_pricing_global.json` (garments, tier discount rules, tailoring services, and special presets like UDI Especial).
  - Executed script via `npx tsx scripts/seedLivePricing.ts` and verified synchronous completion with terminal logging `SUCCESS: Staging pricing/global now matches Live 1:1.`
- **Architectural Compliance**:
  - Zero changes to existing UI components.
  - Script adheres strictly to Rule 300 line limit (13 lines < 300).
  - Zero `any` or `@ts-ignore` usage.

### Fix NewOrderModal Launch & Auto-Seed Baseline Staging Entities (`CustomerSection.tsx`, `NewOrderModal.tsx`, `stagingSeeder.ts`, `pricingDefaults.ts`, `usePricingEngine.ts`, `useOrderCreator.ts`, `DataContext.tsx`)
- **Root Cause & Defrosting**: In the fresh `azafran-staging` database, Firestore has zero collections initially. When `+ NUEVA COTIZACIÓN` was clicked, `NewOrderModal.tsx` blocked on strict guards (`!pricing`) and `CustomerSection.tsx` froze due to empty `clientAccounts` (`[]`).
- **Defensive Rendering Architecture (`NewOrderModal.tsx`, `CustomerSection.tsx`)**:
  - Replaced blocking `!pricing` guard with `effectivePricing = pricing || DEFAULT_PRICING`, allowing `NewOrderModal` to render immediately without waiting for Firestore queries or network trips.
  - Implemented `DEFAULT_FALLBACK_ACCOUNT` (`{ id: 'ACC-000', name: 'Clientes Particulares', category: 'PARTICULAR' }`) in `CustomerSection.tsx` and `NewOrderModal.tsx` whenever `clientAccounts` is empty or loading.
  - Enabled non-blocking corporate account matching and dynamic creation options (`+ Crear nueva empresa`).
- **Resilient Pricing Fallbacks (`pricingDefaults.ts`, `usePricingEngine.ts`, `useOrderCreator.ts`)**:
  - Consolidated fallback pricing rules and structures in `src/utils/pricingDefaults.ts` with complete garments, tailoring services, and discount rules by tier.
  - Enhanced `usePricingEngine` and `useOrderCreator` to seamlessly fall back to `DEFAULT_PRICING` whenever live database pricing is null or initializing.
- **Autonomous Staging Seeder (`src/utils/stagingSeeder.ts`, `DataContext.tsx`)**:
  - Created idempotent `initStagingSeed(db)` that executes once on startup in Staging:
    - Automatically checks `accounts` and `clientAccounts` collections; if empty, inserts baseline entities:
      - `ACC-000`: `{ id: 'ACC-000', name: 'Clientes Particulares', category: 'PARTICULAR', createdAt: timestamp }`
      - `ACC-001`: `{ id: 'ACC-001', name: 'Universidad UDI', category: 'INSTITUCIONAL', createdAt: timestamp }`
    - Checks `users` collection for Don Pablo; if absent, seeds `staging-pablo-alvestegui-admin` (`displayName: 'Pablo Alvestegui'`, `email: 'palvestegui@gmail.com'`, `role: 'admin'`, `status: 'APPROVED'`).
    - Seeds `pricing/global` baseline document if missing from database.
  - Wired into `DataContext.tsx` authenticated snapshot cycle.
- **Rule 300 / Rule 500 Compliance & Zero `any`**:
  - `src/utils/pricingDefaults.ts`: 57 lines (< 300)
  - `src/utils/stagingSeeder.ts`: 115 lines (< 300)
  - `src/hooks/usePricingEngine.ts`: 189 lines (< 300)
  - `src/hooks/useOrderCreator.ts`: 47 lines (< 300)
  - `src/contexts/DataContext.tsx`: 153 lines (< 300)
  - `src/components/modals/newOrder/CustomerSection.tsx`: 423 lines (< 500)
  - `src/components/modals/NewOrderModal.tsx`: 372 lines (< 500)
  - Full TypeScript type-checking (`tsc --noEmit`) passes with 0 errors, and zero usage of `any` or `@ts-ignore`.

### Connect Staging App to Dedicated azafran-staging Firebase Project (`src/firebase.ts`, `src/server/adminDb.ts`, `firebase-applet-config.json`, `LoginView.tsx`)
- **Physical Isolation & Complete Sandbox Independence (`src/firebase.ts`)**: Replaced the legacy production Firebase credentials with dedicated `azafran-staging` project keys (`apiKey: AIzaSyDMjYBLUCJJ_BdJslKpk4iJUS3LnOAd3Yc`, `projectId: azafran-staging`, `authDomain: azafran-staging.firebaseapp.com`, `storageBucket: azafran-staging.firebasestorage.app`, `appId: 1:225609753361:web:3c49d39531080360a1a2b0`, `measurementId: G-7WNKD8S1QE`).
- **Default Database Clean Initialization**: Initialized Firestore directly via `getFirestore(app)` against the default database of `azafran-staging`, removing legacy references to the secondary AI Studio database instance ID. Ensures 100% of Firestore queries, snapshots, and mutations target `azafran-staging` with zero production exposure (`mystic-return-81b2m` is completely untouched).
- **Backend Admin DB & Staging Config Sync (`src/server/adminDb.ts`, `firebase-applet-config.json`)**: Synchronized the server-side Firebase Admin SDK initialization to target `azafran-staging` and the default database, eliminating `any` declarations in `adminDb.ts` to ensure end-to-end full-stack isolation.
- **Diagnostic Links Updated (`LoginView.tsx`)**: Updated the authorized domain troubleshooting console link and diagnostic readout to directly link to the `azafran-staging` Firebase Console authentication settings.
- **Rule 300 / Rule 500 Compliance & Zero `any`**:
  - `src/firebase.ts`: 53 lines (< 300)
  - `src/server/adminDb.ts`: 16 lines (< 300)
  - `src/components/auth/LoginView.tsx`: 176 lines (< 500)
  - Zero `any` or `@ts-ignore` with clean `tsc --noEmit` and build pass.

### Staging Developer Quick-Login Bypass (Zero-Cloud-Friction) (`AuthContext.tsx`, `authHelpers.ts`, `LoginView.tsx`, `App.tsx`)
- **1-Click Staging Quick-Login Bypass (`LoginView.tsx`)**: Introduced a prominent amber developer button (`⚡ Entrar como Don Pablo (SuperAdmin)`) on the staging login screen directly below the Google Sign-in trigger. Allows immediate access into staging without waiting for Firebase Authorized Domains updates or identity provider propagation.
- **Session Provisioning & SuperAdmin Integrity (`AuthContext.tsx`, `authHelpers.ts`)**: Implemented `loginAsStagingAdmin()` in `AuthContext` backed by `STAGING_ADMIN_USER_PROFILE` and `createStagingFirebaseUser()`. Instantly grants Don Pablo's credentials (`palvestegui@gmail.com`, Role: `'admin'`, `isSuperAdmin: true`, status: `'APPROVED'`).
- **Session Storage Persistence (`sessionStorage: azafran_staging_auth`)**: Persists staging authentication across browser page refreshes, and cleanly purges on `logout()`.
- **Strict Rule 300 / 500 Compliance & Zero `any`**:
  - `src/utils/authHelpers.ts`: 232 lines (< 300)
  - `src/contexts/AuthContext.tsx`: 282 lines (< 300)
  - `src/components/auth/LoginView.tsx`: 175 lines (< 500)
  - `src/App.tsx`: 479 lines (< 500)
  - Zero usage of `any` or `@ts-ignore` with clean `tsc --noEmit` validation.

### Firebase Auth Unauthorized Domain Resolution & Staging Diagnostics (`AuthContext.tsx`, `authHelpers.ts`, `LoginView.tsx`, `types/index.ts`, `firebase.ts`)
- **Graceful Error Architecture (`AuthContext.tsx`)**: Replaced uncaught `console.error` and blocking browser alerts on `auth/unauthorized-domain` with a structured `authError` state (`AuthErrorInfo: { code, message, domain }`). Prevents uncaught crash reports while preserving full telemetry.
- **Dedicated Staging Diagnostic Login View (`LoginView.tsx`)**: Extracted the unauthenticated login screen into a modular component. When Firebase rejects an origin hostname due to `auth/unauthorized-domain`:
  - Presents an explanatory diagnostic card identifying the project (`mystic-return-81b2m`) and current container domain.
  - One-click "Copiar Dominio" button with visual feedback to instantly copy the exact Cloud Run hostname to clipboard.
  - Direct action button to open the Firebase Console Authorized Domains settings page (`https://console.firebase.google.com/project/mystic-return-81b2m/authentication/settings`).
  - Step-by-step guidance on how to authorize the domain or wildcard `run.app`.
  - Responsive "Reintentar Inicio de Sesión" button.
- **Modularization & Rule 300/500 Compliance (`authHelpers.ts`)**: Extracted `resolveEffectiveImpersonation` and `syncUserDocument` into `src/utils/authHelpers.ts` (164 lines), reducing `AuthContext.tsx` from 294 to 214 lines (< 300) and `App.tsx` from 483 to 472 lines (< 500).
- **Strict Type Safety (`firebase.ts`, `types/index.ts`)**: Replaced `authInfo: any` in `FirestoreErrorInfo` and `(err: any)` in `AuthContext` with strict typed structures, eliminating `@ts-ignore` and `any` usage.

### Staging Sandbox Visual Differentiation & Environment Safeguards (`MainLayout.tsx`, `SidebarNav.tsx`, `index.html`)
- **Browser Tab Identification (`index.html`, `metadata.json`)**: Updated the browser page title to `🧪 [STAGING] Azafrán Chefwear` so Don Pablo can immediately distinguish staging tabs from live production (`sistema-azafran.ai.studio`) across window tabs.
- **Top Viewport Warning Stripe (`MainLayout.tsx`)**: Applied a high-visibility amber accent line (`border-t-4 border-amber-500`) along the topmost viewport edge of the root layout container.
- **Header Staging Indicator Pill (`MainLayout.tsx`)**: Placed an amber staging badge pill between the breadcrumb navigation and the impersonation dropdown with pulsing indicator light (`animate-ping`). Displays full `🧪 STAGING / PRUEBAS` on desktop and adapts seamlessly to compact `🧪 STAGING` on mobile viewports without crowding out headers or controls.
- **Sidebar Header Staging Badge (`SidebarNav.tsx`)**: Added an amber `STAGING` badge (`bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px]`) adjacent to the brand mark in the expanded sidebar header.
- **Rule 300 / Rule 500 Compliance**: Verified all modified visual layout components remain strictly under the 500-line visual threshold (`MainLayout.tsx`: 279 lines; `SidebarNav.tsx`: 469 lines) with zero TypeScript compiler errors.

### UDI Order Financial Reconciliation Patch (`udiReconciliationPatch.ts`, `udiFabricMigration.ts`)
- **Three-Order Reconciliation Engine**: Created dedicated, idempotent database reconciliation patch (`src/utils/udiReconciliationPatch.ts`) targeting the 3 overcollected UDI student orders in the Firestore `orders` collection:
  - **#ORD-00021 (Mariana Santos / `ORD-1788533995246-669`)**: Set `totalPrice: 253` and `amountCollected: 253`. Removed legacy `reconciliationNote` using `deleteField()`. Leaves Saldo at **Bs 0.00**.
  - **#ORD-00022 (Felipe Coronado / `ORD-1788534268408-593`)**: Set `totalPrice: 149` and `amountCollected: 149`. Removed legacy `reconciliationNote` using `deleteField()`. Leaves Saldo at **Bs 0.00**.
  - **#ORD-00023 (Georgina González / `ORD-1788973360952-614`)**: Set `totalPrice: 584` and `amountCollected: 584` (verified via bank transfer slip). Removed legacy `reconciliationNote` using `deleteField()`. Leaves Saldo at **Bs 0.00**.
- **UDI Fabric Migration Spec Alignment (`udiFabricMigration.ts`)**: Updated `UDI_CORRECTIONS` for Mariana Santos from `expectedTotal: 227.70` to `expectedTotal: 253` with `expectedCollected: 253`, and added `reconciliationNote: deleteField()` to prevent subsequent fabric healing runs from re-introducing overcollected balances.
- **Autonomous Lifecycle Execution (`DataContext.tsx`)**: Wired `runUdiReconciliationPatch(db)` into the authenticated `orders` snapshot listener. Automatically heals and reconciles existing records without requiring manual intervention.
- **Administrative Manual Trigger (`DangerZoneSection.tsx`)**: Added manual execution button (`Reconciliar Sobrecobros UDI (#21, #22, #23)`) in Settings > Danger Zone, providing clear alert modals on reconciliation progress and status.
- **Type Safety (`src/types/index.ts`)**: Added optional `reconciliationNote?: string;` property to the root `Order` interface with zero usage of `any`.
- **Architectural Rules**: Strictly maintained Rule 300/500 compliance across all touched files (`udiReconciliationPatch.ts`: 140 lines; `udiFabricMigration.ts`: 208 lines; `DataContext.tsx`: 147 lines; `DangerZoneSection.tsx`: 197 lines; `types/index.ts`: 274 lines).

### Exclusion Groups Modal In-Place Reactive State (`ExclusionGroupsModal.tsx`, `ServicesCatalogTab.tsx`)
- **Reactive Rename State & Zero-Orphan Cleanup**: Enhanced `ExclusionGroupsModal.tsx` to maintain local reactive state (`activeGroups` and `localServices`) so confirming a group rename (e.g., `REGULADOR` -> `DISTRIBUIDOR`) immediately swaps the code in-place with `prev.map(g => g === oldName ? newName : g)`. Default codes that no longer have assigned services are no longer orphaned or retained with "0 servicios".
- **Dynamic Catalog Exclusions Preference (`ServicesCatalogTab.tsx`)**: Refactored `availableExclusionGroups` to prefer `customExclusionGroups` once customized, preventing unassigned default groups from resurrecting in service card dropdowns.

### On-Screen Invoice Custom Pricing & Embroideries Alignment (`InvoiceModal.tsx`)
- **Custom Service Price Transparency**: Mirrored the custom service pricing engine from `OrderReceiptDocument.tsx` into `InvoiceModal.tsx`. Services with custom pricing (`hasCustomPrice === true`) are strictly filtered out of the unpriced tailoring options block and included in the paid add-on services block with their designated unit price (`Bs {customPrice.toFixed(2)}`) and extended line total (`Bs {(customPrice * qty).toFixed(2)}`).
- **Embroideries Rendering**: Added explicit rendering for `it.embroideries` to display custom embroideries with unit and extended pricing in the on-screen invoice modal.
- **Dedicated Exclusion Groups Modal (`ExclusionGroupsModal.tsx`)**: Created a dedicated administrative modal allowing users to manage canonical exclusion groups, create new groups, rename groups with automatic batch cascading to all assigned services, and delete unused groups with active service count safety warnings.
- **Zero-Truncation 3-Tier Card Architecture (`ServicesCatalogTab.tsx`)**: Overhauled service cards from cramped single-row configurations into a 3-tier hierarchy:
  - **Tier 1 (Header)**: ID badge + full-width service name input (`flex-1`, no truncation, generous input area) + delete button with inline confirmation.
  - **Tier 2**: Garment compatibility button (`ServiceAppliesToModal` launcher), service type selector, and price input in Bs.
  - **Tier 3**: Dedicated standalone exclusion group dropdown with direct link to launch the Exclusion Groups Manager.
- **Stable React Keys**: Enforced `key={`service-card-${originalIndex}`}` across all service cards, eliminating input unmounting and 1-character focus-loss bugs while typing.

### Production View Conflict Shield (`ProductionView.tsx`)
- **Floor Conflict Shield**: Integrated `detectServiceExclusionConflicts` from `serviceUtils.ts` into both Desktop and Mobile views. If an order item contains conflicting services in the same exclusion group (e.g. "Manga larga" and "Manga 3/4"), a high-visibility amber pulsing warning badge (`⚠️ Conflicto: Manga larga / Manga 3/4`) is rendered, alerting cutting and sewing operators to pause before cutting.

### Client Invoice & PDF Price Transparency (`OrderReceiptDocument.tsx`)
- **Custom Service Price Transparency**: Hardened `OrderReceiptDocument.tsx` so custom-priced services (`hasCustomPrice === true` via `it.customServicePrices[s]`) and custom embroideries (`it.embroideries`) render their respective unit prices (`Bs {price}`) and calculated line totals (`Bs {price * qty}`) directly on printed and downloaded PDF receipts, matching the on-screen card display.

### Data Migration & Order Resolution (`udiFabricMigration.ts`)
- **Order #ORD-00018 Conflict Resolution (Sebas Bejarano)**: Implemented idempotent patch in client Firestore migration engine (`udiFabricMigration.ts`) targeting `#ORD-00018` (`ORD-1788275936872-173`). Automatically purges the conflicting service `"Manga larga"`, safely preserving `"Manga 3/4"` and `"Broches metálicos ocultos"`.

### Role-Based Default Landing Tab (`App.tsx`)
- **Automated Role Landing**: Implemented single-execution `useEffect` via `hasSetInitialLandingTab` ref that automatically routes authenticated users to their corresponding workspace on load:
  - `VENTAS` -> `'ventas'`
  - `OPERACIONES` -> `'operaciones'`
  - `PRODUCCION` -> `'produccion'`
  - `ADMIN` / `SUPERADMIN` -> `activeViewRole` (or `'ventas'` if full admin).

### Settings & Catalog Engine (Services Management & Exclusion Groups)
- **Stable Input Reconciliation (`ServicesCatalogTab.tsx`)**: Replaced volatile dynamic keys (`key={`${srv.name || 'srv'}-${originalIndex}}``) with stable keys (`key={`service-card-${originalIndex}}``), resolving input unmounting and single-character focus-loss bugs while typing service names.
- **Service Name Readability (`ServicesCatalogTab.tsx`)**: Removed rigid `truncate` class constraints and added full-string HTML `title` tooltips, permitting full visibility for lengthy service names (e.g., cross straps, inner pocket magnets).
- **Managed Exclusion Groups Architecture (`serviceUtils.ts`, `ServicesCatalogTab.tsx`)**: Replaced raw free-form text input with a controlled uppercase dropdown incorporating canonical default groups (`DEFAULT_EXCLUSION_GROUPS`: `MANGA`, `CUELLO`, `TIROS`, `BOLSILLO`, `ESPALDA`, `CIERRE`, `PECHERA`, `BOTONES`, `VIVO`), dynamically aggregated existing custom groups, and an inline modal workflow (`+ Crear nuevo grupo...`) to enforce catalog hygiene and eliminate casing/whitespace fragmentation.
- **Mutual Exclusion Engine (`GarmentConfigurator.tsx`)**: Upgraded selection resolver to sanitize and compare `exclusionGroup.trim().toUpperCase()`, instantly deselecting any active service sharing the same exclusion group on the configured item.

### Production View & Floor Visibility (`ProductionView.tsx`)
- **Tailoring Add-ons Micro-Badges**: Rendered `item.services` as a compact badge strip (`text-[9px] font-bold text-amber-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded`) immediately below fabric descriptors in both Desktop Ledger and Mobile Production Cards. Ensures cutting and assembly operators have immediate visual confirmation of sleeve lengths, custom closures, and tailoring options directly on the production floor.

### Invoicing & Financial Display (`OrderReceiptDocument.tsx`, `ActiveOrdersList.tsx`, `QuotesList.tsx`)
- **Custom Service Price Transparency**: Hardened service rendering guards across receipts, active orders, and quotations to verify `hasCustomPrice = Boolean(it.customServicePrices && Number(it.customServicePrices[s]) > 0)`. Prevents custom-priced tailoring services from being incorrectly relegated to unpriced construction options, ensuring line-item amounts and prices are rendered visibly on official documents.

### Architectural (Dumb View Compliance)
- **ActiveOrdersList.tsx Total Resolution**: Refactored line 99 in `ActiveOrdersList.tsx` to prioritize the committed Firestore database `totalPrice` (`order.totalPrice !== undefined && order.totalPrice !== null ? Number(order.totalPrice) : getOrderBreakdown(...).total`). Enforces the Dumb View architectural mandate, preventing runtime engine recalculations from falling back to retail catalog rates when custom fabrics (like UDI student uniform packages) are present, which previously caused balance discrepancies and false Bs 0.00 displays.

### Migration & Data Integrity (UDI Student Fabric Correction)
- **Liliana Montero Order Disambiguation (`src/utils/udiFabricMigration.ts`)**: Resolved multi-order collision where Liliana Montero had both an existing historical Pantalón order (already Drill de 8oz) and an active Filipina order (#ORD-00025). Enhanced candidate matching and added `requiredGarment: 'Filipina'` filtering so the migration specifically locates and patches the Filipina item in order #ORD-00025 (`ORD-1789145786489-650`) to "Drill de 8oz" with `totalPrice: 253`.
- **Auto-Healing Sentinel Hardening (`DataContext.tsx`)**: Updated the auto-heal verification gate to require `alreadyCorrectCount === 3` before setting the session verification flag, ensuring all 3 UDI student records are verified correct.
- **Engineered `src/utils/udiFabricMigration.ts`**: Built a typed migration utility to heal mislabeled fabric records and preserve financial totals in the Firestore `orders` collection:
  - **#ORD-00025** (Liliana Montero / `ORD-1789145786489-650`): Patched `items[0].fabric` from `"Gabardina de 2da"` to `"Drill de 8oz"`. Total: Bs 253, Cobrado: Bs 200.
  - **#ORD-00024** (Luciane Durán / `ORD-1789145868176-152`): Patched `items[0].fabric` from `"Gabardina de 2da"` to `"Drill de 8oz"`. Total: Bs 253, Cobrado: Bs 200.
  - **#ORD-00021** (Mariana Santos / `ORD-1788533995246-669`): Patched `items[0].fabric` from `"Tornado (Bull Denim)"` to `"Drill de 6oz"`. Total: Bs 227.70, Cobrado: Bs 253.
- **Auto-Healing Integration (`DataContext.tsx`)**: Bound automatic background check upon authenticated load, applying the patch idempotently and ensuring zero redundant writes once verified.
- **Admin Manual Control (`DangerZoneSection.tsx`)**: Added manual trigger button `"Corregir Telas UDI (#21, #24, #25)"` within the settings danger zone for direct inspection and execution.

### Added
- Implemented secure server-side `Pulse` Read-Only API endpoint (`/api/pulse`) for AI assistant auditing and metric retrieval.
- Converted application architecture to Full-Stack (Express + Vite) to support isolated, zero-hardcoding backend execution in Cloud Run.
- Integrated \`firebase-admin\` in \`server.ts\` for backend Firestore execution, bypassing client \`firestore.rules\` strict boundaries safely.


### Fixed
- Fixed CRM Directorio rendering 'PARTICULAR' indefinitely for specific contact roles (such as 'ESTUDIANTE' or 'DOCENTE'). 
- Synchronized \`EditContactModal.tsx\` to bind directly to the exact computed role dropdown value before saving to Firestore, bypassing static state desynchronization.
- Refactored \`contactUtils.ts\` unify engine to intelligently derive and display appropriate \`cargo\` based on accurate underlying \`accountId\` mapping if not explicitly provided.


### Added
- Implemented SuperAdmin "Fusionar Contacto" inline modal within \`ContactProfileModal.tsx\` to safely merge duplicate contacts into master records.
- Engineered atomic Firestore Batch migrations transferring all associated active and historical orders/quotes from the duplicate to the chosen master contact seamlessly.

### Changed
- Extracted \`TAILORING_12_POINTS\` constant to \`contactUtils.ts\` to ensure \`ContactProfileModal.tsx\` adheres strictly to architectural Rule 500 line limits.


### Fixed
- Resolved fatal runtime ReferenceErrors that caused a white screen on mount. Correctly injected missing \`useState\` hook imports and state initializers inside \`QuotesList.tsx\`.

### Fixed
- Restored missing state declarations for \`orderToRevert\`, \`isReverting\`, \`quoteToDelete\`, and \`isDeleting\` in \`ActiveOrdersList.tsx\` and \`QuotesList.tsx\` that were causing ReferenceErrors during modal invocation.
\n### Fixed
- Banned all browser-native \`window.confirm()\` and \`window.alert()\` instances from \`ActiveOrdersList.tsx\` and \`QuotesList.tsx\`.

### Added
- Implemented a custom in-app Confirmation Modal for "Revertir a Cotización" featuring specific warning body text matching the order ID, resolving smoothly via the DOM-based Toast notification system on completion.
- Implemented a custom in-app Confirmation Modal for "Eliminar Cotización" (Admin Hard Delete) ensuring the destruction scope is completely spelled out before triggering the toast notification workflow.


### Fixed
- Migrated Authentication Provider from \`signInWithRedirect\` to \`signInWithPopup\` in \`AuthContext.tsx\` to resolve cross-domain mobile browser session drops.
- Ensured immediate user profile resolution persists via the \`onAuthStateChanged\` observer reacting to the synchronous popup resolution.


### Fixed
- Fixed Revert Schema in ActiveOrdersList.tsx by explicitly asserting docType: COTIZACION and status: Cotización rather than deleting the field.
- Fixed the Hard-Delete execution target in QuotesList.tsx by guaranteeing the target document ID resolves correctly via (order as any).id || (order as any).orderId.

### Added
- Integrated a global DOM-based Toast notification engine (src/utils/toastUtils.ts) and connected it to primary conversion events to deliver affirmative feedback.


### Fixed
- Fixed multi-quote creation loop by passing 'isSubmitting' state to 'OrderSummaryAndCheckout' and disabling the submission button during dispatch.
- Restored the 'Revertir a Cotización' action for actual Super Admins in ActiveOrdersList.tsx, correctly resetting the order status to Estimado and stripping out production status flags.

### Added
- Added an 'Eliminar (Admin)' hard-delete button to QuotesList.tsx exclusively for actual Super Admins, allowing direct purging of test quotes from Firestore via deleteDoc.

## [Unreleased]
### Changed
- Refactored `GarmentSizingSection.tsx` to restore full interactivity for standard size selection across all modes (including UDI).
- Modified `GarmentConfigurator.tsx` to strictly validate the 8 Filipina measurements only when the garment sizing type is explicitly set to 'A Medida' (Custom) AND the mode is 'Orden Activa' (bypassing validation for 'Cotización' mode and standard sizing).
- Ensured 100% interactive write capabilities for Ventas role during Order Creation and Quotations, restricting `isWriteDisabled` strictly to Taller/Workshop views.

# Changelog

All notable changes and architectural updates to Azafrán Chefwear are documented here.

## [Executive Intelligence and Action Engine (Socket 3)] - 2026-09-12
### Added / Implemented
- **Expanded GET `/api/pulse` Endpoint (`server.ts`)**:
  - Implemented 3 new operational intelligence entities for agent read-only reporting:
    - `entity=reports`: Computes total confirmed revenue, pending balances, collection rates, average ticket size, and aggregates a leaderboard of top-selling garments and revenue by category/fabric.
    - `entity=sellers`: Aggregates active sales metrics grouped by assigned seller (conversion rate, total quotes, confirmed orders, generated revenue).
    - `entity=bottlenecks`: Scans all active orders to detect operational friction (stalled material readiness > 48h, delivery risk > 15 days, uncollected balances post-production, and data anomalies like overcollection or negative balances).
  - Improved data normalization for existing `orders` and `quotes` entities with robust resolution for `customer` names and `itemsSummary` structures.

- **Authenticated Action Endpoints (`server.ts`)**:
  - Implemented 4 new POST endpoints under `/api/action/*`, strictly protected by the `x-pulse-key` verification mechanism.
  - `POST /api/action/revert-order`: Updates a specific order's status to 'Cotización' and document type to 'quote'.
  - `POST /api/action/delete-quote`: Locates and permanently destroys a quotation document from Firestore.
  - `POST /api/action/merge-contacts`: Atomically reassigns all orders and quotations from a duplicate contact to a master contact via batch write, then eliminates the duplicate.
  - `POST /api/action/create-quote`: Instantiates a new quotation document directly into Firestore.
  
### Architecture & Compliance
- Integrated `express.json()` middleware into the Express application.
- Ensured strict 200/400/401/500 HTTP response codes and error handling blocks across all custom routes.
- Zero TypeScript diagnostics (`tsc --noEmit` passed cleanly) and production build verified via `compile_applet`.

## [SuperAdmin Modo Vista (Impersonation Selector)] - 2026-09-12
### Added / Implemented
- **SuperAdmin "Modo Vista" Impersonation Selector in TopBar (`MainLayout.tsx`)**:
  - Embedded a discreet top-right selector `[ 👁️ Vista: Admin ▾ ]` in the TopBar (visible on both mobile and desktop), strictly guarded by `isActualSuperAdmin || isSuperAdmin`.
  - Configured 4 impersonation options:
    - `'Administrador (Full access)'`: Restores full SuperAdmin visibility, tabs, and permissions.
    - `'Ventas (Matías)'`: Enforces Ventas role restrictions (hides Ajustes, Reportes, and Directorio; enforces 8 Filipina measurements; locks workshop action triggers in Operations, Production, and Logistics).
    - `'Operaciones (León)'`: Switches perspective to Operations management (suppresses sales pricing modifications and roles admin).
    - `'Producción (Doris)'`: Switches perspective to Workshop Production management.
- **Purely Local & Safe State Persistence (`AuthContext.tsx`)**:
  - Added `activeViewRole` state initialized from `sessionStorage` (`azafran_active_view_role`).
  - Stored strictly in React state and `sessionStorage`; NEVER written to Firestore, completely eliminating any risk of admin self-lockout or database pollution.
  - Computed `effectiveUserProfile`, `effectiveIsAdmin`, and `effectiveIsSuperAdmin` dynamically from the raw auth profile and `activeViewRole`.
  - Preserved `isActualSuperAdmin` so SuperAdmin can toggle back to `'admin'` at any time.
- **UI Guarding & Workshop Trigger Locking (`App.tsx`, `SidebarNav.tsx`)**:
  - `SidebarNav.tsx`: Dynamically hides Directorio, Reportes, and Ajustes navigation items when the effective role is `VENTAS`.
  - `App.tsx`: Conditionally unmounts Directorio (`clientes`), Reportes (`reportes`), and Ajustes (`ajustes`) views when effective role is `VENTAS`.
  - `App.tsx`: Updated `isWriteDisabled` to lock all workshop triggers (`operaciones`, `produccion`, `logistica`) when effective role is `VENTAS`.
  - `MainLayout.tsx`: Automatically redirects to the `ventas` tab if the user switches to `'Ventas (Matías)'` while currently viewing a restricted view (`ajustes`, `reportes`, `clientes`).
- **Enforced 8 Filipina Measurements for Ventas (`GarmentConfigurator.tsx`, `GarmentSizingSection.tsx`)**:
  - `GarmentConfigurator.tsx`: Validates that all 8 required measurements for Filipina (`pecho`, `cintura`, `cadera`, `espalda`, `manga`, `largo`, `hombro`, `cuello`) are completed when adding an active order item in Ventas role.
  - `GarmentSizingSection.tsx`: Displays an informative status badge `Rol Ventas (Matías) · 8 Medidas Obligatorias` when custom sizing is active for a Filipina.

### Architecture & Compliance
- Strict Rule 300 / Rule 500 compliance:
  - `src/contexts/AuthContext.tsx`: 289 lines (< 300 limit)
  - `src/components/layout/MainLayout.tsx`: 272 lines (< 500 limit)
  - `src/components/layout/SidebarNav.tsx`: 464 lines (< 500 limit)
  - `src/App.tsx`: 460 lines (< 500 limit)
  - `src/components/modals/newOrder/GarmentConfigurator.tsx`: 421 lines (< 500 limit)
  - `src/components/modals/newOrder/GarmentSizingSection.tsx`: 184 lines (< 500 limit)
  - `src/types/index.ts`: 273 lines (< 300 limit)
- Type Safety & Verification: `lint_applet` passed cleanly (0 errors), `tsc --noEmit` exit code 0, and `compile_applet` succeeded.

## [Fix Pre-Provisioned User UID Binding & Firestore Security Rules] - 2026-09-12
### Fixed / Implemented
- **Pre-Provisioned User UID Binding via Query in AuthContext (`AuthContext.tsx`)**:
  - Replaced direct email-keyed document lookup with a query on `users` where `email == user.email` (matching the Firestore security rule filter).
  - When an authenticated user logs in without an existing UID document, the system queries for their approved pre-provisioned record (`status == 'APPROVED'`).
  - Utilized `writeBatch` to execute an atomic batch write: creates `users/{user.uid}` with designated roles, permissions, and metadata, and deletes the temporary email-keyed placeholder document in a single commit.
  - Added safe try/catch and snapshot error callbacks to prevent unhandled rejections or login loops.
- **Firestore Security Rules Update (`firestore.rules`)**:
  - Configured `users/{userId}` security rules permitting authenticated users to:
    - Read and delete a document in `users` if `resource.data.email == request.auth.token.email`.
    - Create their own document where `request.auth.uid == userId` and `request.resource.data.email == request.auth.token.email`.
  - Maintained role-based administrative permissions for SuperAdmin and account managers.
  - Deployed updated rules to Firebase via `deploy_firebase`.

### Architecture & Compliance
- Strict Rule 300 / Rule 500 compliance:
  - `src/contexts/AuthContext.tsx`: 202 lines (< 300 limit)
  - `firestore.rules`: 51 lines
- Type Safety & Verification: `lint_applet` passed cleanly (0 errors), `tsc --noEmit` exit code 0, and `compile_applet` succeeded.

## [Pre-Provision User Accounts & Roles & Usuarios Integration] - 2026-09-12
### Added / Implemented
- **SuperAdmin-Only '+ Agregar Usuario' Toolbar Action (`UsersManagementSection.tsx`)**:
  - Embedded `[ + Agregar Usuario ]` action button directly in the Roles & Usuarios management toolbar, guarded strictly by `isSuperAdmin` from `useAuth()`.
- **Pre-Provision User Modal Component (`AddUserModal.tsx`)**:
  - Developed compact, accessible modal (< 240 lines, Rule 500 compliant) for SuperAdmin account pre-provisioning.
  - Implemented standard RFC 5322 regex validation on the email input with live blur checks and duplicate registration detection.
  - Provided role selection across 5 designated roles: `'ventas'`, `'operaciones'`, `'produccion'`, `'logistica'`, `'admin'` with dynamic preview of default permissions.
  - Atomic write to the Firestore `users` collection with `status: 'APPROVED'`, `preProvisioned: true`, and corresponding permission flags.
- **Centralized Role Permissions Engine & RFC 5322 Validator (`userRoleUtils.ts`)**:
  - Defined `ASSIGNED_ROLE_CONFIG`, `validateRFC5322Email`, and `getDefaultPermissionsForRole` in `src/utils/userRoleUtils.ts` (< 90 lines, Rule 300 compliant), adhering to Zero Hardcoding Policy.
- **Seamless Google OAuth Session Binding (`AuthContext.tsx`)**:
  - Upgraded `onAuthStateChanged` handler in `AuthContext.tsx` (< 190 lines, Rule 300 compliant).
  - When a pre-provisioned user signs in via Google OAuth, the system automatically detects their email record, copies all pre-provisioned roles, permissions, and metadata into their active UID document, deletes the temporary placeholder doc, and immediately authorizes their session with zero manual intervention required.
- **Visual Feedback & Badges**:
  - Rendered `PRE-PROVISIONADO` badge in `UsersManagementSection` user cards to distinguish pre-registered users prior to first login.

### Architecture & Compliance
- Strict Rule 300 / Rule 500 compliance:
  - `src/utils/userRoleUtils.ts`: 88 lines (< 300 limit)
  - `src/types/index.ts`: 272 lines (< 300 limit)
  - `src/components/modals/AddUserModal.tsx`: 236 lines (< 500 limit)
  - `src/contexts/AuthContext.tsx`: 184 lines (< 300 limit)
  - `src/contexts/DataContext.tsx`: 115 lines (< 300 limit)
  - `src/components/views/settings/UsersManagementSection.tsx`: 232 lines (< 500 limit)
- Type Safety & Verification: `lint_applet` passed cleanly (0 errors), `tsc --noEmit` exit code 0, and `compile_applet` succeeded.

## [Fix Parent Account Auto-Population & Preserve Selection Intent] - 2026-09-11
### Fixed / Refactored
- **Eliminated Auto-Selection of First Account on Category Change (`CustomerSection.tsx`)**:
  - Removed arbitrary `matchingAccounts[0]` selection logic when changing client categories (`clientType` / `tipoCliente`).
  - Category changes now exclusively filter dropdown options without imposing any account into state.
- **Default to 'Crear Nueva Empresa' for Unknown/New Clients**:
  - For new sales/quotes without an explicitly linked registered contact or account, `accountId` defaults to `'create_new'` (rendered as `+ Crear nueva empresa` in the dropdown).
  - Explicit company name input field automatically renders when `create_new` is active.
- **Preserved Explicit Selection Intent**:
  - If a user explicitly selects an existing account (or previously opted for `+ Crear nueva empresa`), subsequent category changes preserve that selection and do not wipe or overwrite it.
  - Accounts explicitly selected remain available and selected in the dropdown even if outside the active category filter.
- **Audited Contact Resolution Fallback (`contactResolution.ts`)**:
  - Removed `matchingAccounts[0]` fallback when resolving contacts having only a raw category without an explicit account assignment.

### Architecture & Compliance
- Adhered strictly to Rule 300 / Rule 500 limits:
  - `CustomerSection.tsx`: 414 lines (< 500 limit).
  - `contactResolution.ts`: 245 lines (< 300 limit).
- Type Safety & Verification: `lint_applet` (0 errors) and `compile_applet` passed cleanly.


## [NewOrderModal Desktop Widescreen Unclamp (1560px) & Grid Scaling] - 2026-09-11
### Redesigned / Refactored
- **Desktop Modal Container Unclamp (`NewOrderModal.tsx`)**:
  - Expanded modal card geometry to `w-full h-full lg:h-auto lg:max-h-[92vh] lg:w-[96vw] lg:max-w-[1560px] rounded-none lg:rounded-2xl m-0 lg:m-auto p-3 sm:p-4 lg:p-6 bg-stone-950 border-0 lg:border lg:border-stone-800`.
  - Replaced backdrop container classes with `fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4 overflow-hidden`, maximizing usable horizontal screen real estate.
- **Natural Grid Scaling Across Widescreen Viewport**:
  - Internal 12-column grid (`grid grid-cols-1 lg:grid-cols-12 gap-6`) spans smoothly up to 1560px width:
    - Left Column (Form, Customer, Garment Configurator, Notes): `lg:col-span-7 xl:col-span-7`.
    - Right Column (Cart, Summary, Total, Checkout): `lg:col-span-5 xl:col-span-5`.
- **Mobile Invariance**:
  - Preserved complete full-bleed edge-to-edge layout on mobile (<1024px) with single-row 32px header and slim scrollbars.

### Architecture & Compliance
- Verified strict line count compliance: `NewOrderModal.tsx` (362 lines < 500 limit).
- Verified type safety and clean build: `lint_applet` (0 errors) and `compile_applet` (success).

## [NewOrderModal Desktop Max-W-6xl Workspace & Mobile Decoupling] - 2026-09-11
### Redesigned / Refactored
- **Decoupled Desktop vs. Mobile Modal Viewport (`NewOrderModal.tsx`)**:
  - Restored expansive Tier 1 Workspace responsive sizing for desktop screens (`lg:max-w-6xl lg:h-auto lg:max-h-[90vh] lg:rounded-2xl lg:m-auto lg:p-6 lg:border lg:border-stone-800`), eliminating the restrictive `sm:max-w-3xl` constraint while maintaining full-bleed edge-to-edge on mobile (`w-full h-full rounded-none m-0 p-3 sm:p-4 bg-stone-950 border-0`).
  - Adjusted backdrop padding to seamlessly center the modal on desktop (`p-0 lg:p-6 flex items-center justify-center`).
- **Restored 2-Column Desktop Grid Spacing (`NewOrderModal.tsx`)**:
  - Enforced `grid grid-cols-1 lg:grid-cols-12 gap-6` internal split layout:
    - Left Column (Form, Customer, Configurator, Notes): `lg:col-span-7 xl:col-span-7 space-y-2.5 sm:space-y-4`.
    - Right Column (Cart, Summary, Total, Checkout): `lg:col-span-5 xl:col-span-5 space-y-4`.
  - Re-established wide horizontal clearance for 2-column dropdowns ("Particular / Individuo", "Cargo Específico") without text clipping or truncated labels.
- **Preserved Mobile Optimizations**:
  - Retained single-row 32px mobile header with unified segmented mode toggle, backdating trigger, and close button, while keeping the explicit title visible on desktop (`hidden lg:block`).

### Architecture & Compliance
- Verified strict line count compliance: `NewOrderModal.tsx` (362 lines < 500 limit).
- Verified type safety and clean build: `lint_applet` (0 errors) and `compile_applet` (success).

## [NewOrderModal & CustomerSection Mobile Edge-to-Edge & Vertical Compression] - 2026-09-11
### Redesigned / Refactored
- **Full-Bleed Edge-to-Edge Mobile Viewport (`NewOrderModal.tsx`)**:
  - Replaced outer lateral margins and padding on mobile screens (<640px) with `w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-none sm:rounded-2xl m-0 p-3 sm:p-6 bg-stone-950 border-0 sm:border sm:border-stone-800`.
  - Added custom scrollbar utilities (`scrollbar-thin` and `no-scrollbar` in `src/index.css`) to eliminate thick native scrollbars.
- **Single-Row Unified Mobile Header (`NewOrderModal.tsx`)**:
  - Hidden redundant headline text on mobile (`hidden sm:block`) and unified the mode toggle segmented pill, backdate button, and close icon into a single horizontal row.
- **Compact 2-Column Customer Inputs (`CustomerSection.tsx`)**:
  - Replaced stacked rows for "Tipo de Cliente (Categoría)" and "Cargo Específico" with a responsive 2-column grid (`grid grid-cols-2 gap-2`).
  - Tightened form vertical rhythm (`space-y-2.5 sm:space-y-4 mb-3`).
- **Streamlined Institutional Order Toggle (`CustomerSection.tsx`)**:
  - Converted the institutional roster section into a clean single-line toggle row (`flex items-center justify-between py-2 px-3 bg-stone-900/50 rounded-xl border border-stone-800/80`).
  - Removed verbose subtitle ("Compra masiva centralizada con nómina individual y tallas por empleado"), retaining the direct switch and animated roster chip.
- **Ultra-Compact Vendedor Asignado Row**:
  - Minified SuperAdmin seller row padding to `py-1` with `gap-1.5` and `text-xs`.

### Architecture & Compliance
- Verified strict line count compliance: `NewOrderModal.tsx` (360 lines < 500 limit), `CustomerSection.tsx` (393 lines < 500 limit).
- Verified type safety and clean build: `lint_applet` (0 errors) and `compile_applet` (success).

## [NewOrderModal Header De-bloating & Seller Lockdown] - 2026-09-11
### Redesigned / Refactored
- **Compact Header & Discreet Toggle (`NewOrderModal.tsx`)**:
  - Replaced oversized title and verbose explanatory subtitles ("MODO COTIZACIÓN: VALIDACIONES RELAJADAS..." / "MODO ORDEN ACTIVA: VALIDACIONES ACTIVAS...") with a sleek, compact title (`text-sm sm:text-base font-black uppercase tracking-wider text-stone-200`).
  - Redesigned mode selector into a discreet segmented toggle (`bg-stone-900/80 p-0.5 rounded-lg border border-stone-800 text-xs font-bold`) with active Cotización (`bg-stone-800 text-stone-200`) and active Orden Activa (`bg-amber-500 text-stone-950 font-black`).
  - Aligned title, historical toggle, mode selector, and close button on a single tidy header line, reclaiming vertical viewport space.
- **Lock & Minimize 'Vendedor Asignado' (`CustomerSection.tsx`, `AuthContext.tsx`, `sellerUtils.ts`, `useOrderState.ts`, `useOrderSubmission.ts`)**:
  - Gated seller assignment strictly behind `isSuperAdmin` permission.
  - Standard sellers (e.g., Matias, staff): The entire `Vendedor Asignado` card and selector are suppressed from rendering in the DOM. Order initialization and submission silently default to the authenticated user (`currentUser.uid` / `currentUser.displayName`).
  - SuperAdmin: Removed the bulky card container, avatar circle, and 'COMISIONES' badge; replaced it with a sleek, low-profile inline row directly above the customer inputs with a discreet dropdown selector for creating orders on behalf of team members.
  - Added first-class `isSuperAdmin` to `AuthContext` and enforced attribution resolution in `sellerUtils.ts`.

### Architecture & Compliance
- Strict line count compliance verified: `NewOrderModal.tsx` (359 lines < 500), `CustomerSection.tsx` (396 lines < 500), `sellerUtils.ts` (123 lines < 300), `useOrderState.ts` (72 lines < 300), `useOrderSubmission.ts` (291 lines < 300), `AuthContext.tsx` (124 lines < 300).
- Zero TypeScript diagnostics (`tsc --noEmit` passed cleanly) and production build verified via `compile_applet`.

## [Ajustes Layout Cleanup & Button Ergonomics] - 2026-09-11
### Redesigned / Refactored
- **ServicesCatalogTab Toolbar Unification**:
  - Removed top hero container ("CATÁLOGO DE SERVICIOS ADICIONALES (BS)" title banner, subtitle, and detached "+ NUEVO SERVICIO" button).
  - Elevated search and filter container to the top as a unified 2-row toolbar: Row 1 features a bounded search input (`w-full sm:w-80 md:w-96 max-w-sm`) paired with the "+ Nuevo Servicio" button aligned to the right; Row 2 houses horizontal category filter pills.
  - Updated bottom sticky action button label from "Actualizar Precios Globales" to "Guardar Servicios".
- **DiscountRulesTab Sticky Action Bar & Ergonomics**:
  - Replaced full-width wall-to-wall save button with an ergonomic sticky bottom action bar matching the design in Servicios.
  - Added pending change sentinel: save button is disabled (`disabled:opacity-40 disabled:cursor-not-allowed`) when no unsaved changes exist in discount policies.
  - Replaced giant submit button in `SettingsView.tsx` for base pricing and specials with a compact, right-aligned action button.
- **De-bloated Subtitle Text**:
  - Removed explanatory subtitle text under toggles in `TierVolumeDiscountEditor.tsx` and `TierDiscountRulesCard.tsx` (B2B warning, volume disabled notice, slider limit note, full package explanation), retaining clear titles and direct inputs.

### Architecture & Compliance
- Strict line count compliance verified: `ServicesCatalogTab.tsx` (467 lines < 500), `TierDiscountRulesCard.tsx` (300 lines < 500), `TierVolumeDiscountEditor.tsx` (110 lines < 500), `DiscountRulesTab.tsx` (179 lines < 500), `SettingsView.tsx` (193 lines < 500).
- Zero TypeScript diagnostics (`tsc --noEmit` passed cleanly) and production build verified via `compile_applet`.

## [Pass 5] - 2026-09-11
### Added / Migrated
- **Sidebar Settings Navigation**: Migrated Ajustes tab navigation into `SidebarNav.tsx` as an expandable accordion group with 5 discrete sub-items ("Tarifario Base", "Especiales", "Servicios", "Descuentos", "Roles & Usuarios").
- **Security Gating**:
  - Gated "Roles & Usuarios" in the sidebar and settings view exclusively to `canManageRoles || isSuperAdmin`.
  - Restricted "Registro Histórico" backdating mode and migration discount in `NewOrderModal.tsx` strictly to `isSuperAdmin === true`.
- **Validation Sentinels**: Added pulsating error indicators in the sidebar next to "Tarifario Base" and "Especiales" when invalid price inputs exist.
- **Global Settings Synchronization**: Wired `settingsTab` state through `App.tsx` and `MainLayout.tsx` down to `SettingsView.tsx` with dynamic breadcrumbs.

### Removed / De-bloated
- **SettingsView Horizontal Strip**: Liquidated redundant tab button strip in `SettingsView.tsx`.
- **PriceReference Hero Banner**: Eliminated oversized header card in `PriceReference.tsx`; replaced with a single responsive 40px toolbar containing garment counter and real-time search input.
- **SpecialPresetsTab Header Redundancy**: Removed duplicate secondary contract card box in `SpecialPresetsTab.tsx`; aligned preset deletion action alongside selector pills.
- **Text Bloat**: Removed repetitive explanatory guide text from `DiscountRulesTab.tsx` and `TierDiscountRulesCard.tsx`.

### Architecture & Compliance
- Adheres strictly to Rule 300 (logical files) and Rule 500 (visual components).
- Zero usage of `any` in new interfaces and strict TypeScript type-checking.

## 2026-09-12
### Added
- Implemented native Model Context Protocol (MCP) server endpoint at `/mcp` in `server.ts`.
- Integrated SSE handshake for Gemini Spark connectivity.
- Integrated JSON-RPC 2.0 dispatcher for 11 tools including `get_summary`, `get_reports`, `create_quote`, etc.

### Changed
- Refactored `server.ts` to strictly adhere to Architectural Mandate Rule 300/500.
- Extracted pulse endpoints and action handlers into `src/server/pulseService.ts`.
- Extracted MCP logic into `src/server/mcp.ts` to maintain small, composable logical files.
- Re-architected backend `server.ts` line count from > 750 down to 238 lines.

### Technical Debt / State
- Zero hardcoding and strict type safety enforced across all new server modules.

## [2026-09-12] - Server Boot Stabilization & Client SDK Migration
- **Root Cause Addressed**: The Node backend server was previously attempting to use \`firebase-admin/firestore\` which resulted in fatal startup crashes and PERMISSION_DENIED errors when running under the platform's default ADC (Application Default Credentials).
- **Architectural Shift**: Re-routed the backend to utilize the web SDK (\`firebase/firestore\`) in Node.js instead, using the existing client \`app\` instance from \`src/firebase.ts\`.
- **Refactoring**: Completely rewrote \`src/server/pulseService.ts\` from the \`firebase-admin\` object-oriented \`db.collection()\` format to the modular \`firebase/firestore\` syntax (e.g. \`getDocs(collection(...))\`). 
- **Resilience**: Injected global \`uncaughtException\` and \`unhandledRejection\` listeners into \`server.ts\` to prevent silent container crashing and log robust diagnostics.

## [2026-09-12] - Server DB Connection Refactoring
- **Architectural Adjustment**: Refactored `server.ts`, `src/server/mcp.ts`, and `src/server/pulseService.ts` to directly import the unified `db` instance from `src/firebase.ts`. This eliminates redundant connection initialization and guarantees the backend uses the exact same `firestoreDatabaseId` configuration from `firebase-applet-config.json` that the frontend uses.
- **Dependency Injection Removal**: Stripped the `db: Firestore` parameter from all `pulseService` functions because they now internally rely on the singleton `db` import, leading to cleaner interfaces.
- **Verification**: Built `tsc`, ran `npm run build`, and cleanly restarted the backend. The API endpoints immediately connect to the intended database configuration without hardcoded IDs.

## [2026-09-12] - Restored firebase-admin for MCP Backend
- **Firebase Initialization**: Reverted the MCP backend services (`pulseService.ts`, `server.ts`, and `mcp.ts`) from using the standard Web SDK (`firebase/firestore`) back to `firebase-admin/firestore`. 
- **Admin App Context**: Integrated explicit `firebase-admin/app` initialization inside `src/server/adminDb.ts` matching the requested `projectId`. Mapped the instantiated `adminDb` connection to the exact target `firestoreDatabaseId` dynamically inferred from `firebase-applet-config.json` (bypassing Firestore Rules validation which caused "Missing or insufficient permissions").
- **Quote Creation Refactoring**: Formally standardized `handleActionCreateQuote` locally in `pulseService.ts`. Rebuilt document generation logic to query against `db.collection('orders')`, infer the next sequential `orderId` dynamically (falling back to `#ORD-00026`), and assign the complete standard payload keys (e.g. `docType`, `sellerName`, `amountCollected`).
- **Dependency Clean-up**: Stripped outdated Web SDK `firebase/firestore` queries (`getDocs`, `collection`) entirely out of the TS backend source, exchanging them purely for robust Admin SDK dot chaining syntax (`db.collection(...).get()`). Verified and successfully resolved compiler output.

## [2026-09-15] - Workshop Production Custom Measurements Support
- **Feature**: Surfaced 8-point tailoring measurements directly into the Workshop Production view (`ProductionView.tsx`) to assist tailors like Doña Doris.
- **UI Architecture**: Implemented a responsive toggle drawer that conditionally evaluates if any custom measurement fields exist beyond standard sizing for a grouped garment. 
- **Design execution**: 
  - An amber `[✂️ A MEDIDA]` badge clearly overrides or sits next to the standard sizing pill.
  - Expanding the `[📏 Medidas de Taller]` dropdown renders a dark, high-contrast, mathematically tight grid detailing specific limb and torso lengths based on garment type (Pants vs. Tops).
- **Line Count Discipline**: Refactored the insertion surgically into the existing iteration block, successfully keeping the `ProductionView.tsx` component well under 300 lines (currently at 258 lines).

## [2026-09-15] - Workshop Production Custom Measurements Support
- **Feature**: Surfaced 8-point tailoring measurements directly into the Workshop Production view (\`ProductionView.tsx\`) to assist tailors like Doña Doris.
- **UI Architecture**: Implemented a responsive toggle drawer that conditionally evaluates if any custom measurement fields exist beyond standard sizing for a grouped garment. 
- **Design execution**: 
  - An amber \`[✂️ A MEDIDA]\` badge clearly overrides or sits next to the standard sizing pill.
  - Expanding the \`[📏 Medidas de Taller]\` dropdown renders a dark, high-contrast, mathematically tight grid detailing specific limb and torso lengths based on garment type (Pants vs. Tops).
- **Line Count Discipline**: Refactored the insertion surgically into the existing iteration block, successfully keeping the \`ProductionView.tsx\` component well under 300 lines (currently at 258 lines).

## [2026-09-15] - Workshop Production Custom Measurements Cascade Update
- **Feature**: Extended the Workshop custom tailoring measurements logic in `ProductionView.tsx` with a powerful 3-Tier fallback mechanism.
- **Architectural Directive**: Implemented logic to support multi-garment Bundles ('Uniforme Completo UDI'), ensuring the production card searches the garment tree to surface related specs:
  - **Tier 1 (Garment Level)**: Resolves directly against sibling garments in the order items (e.g. searching the bundle's children for "filipina" and "pantalón" measurements).
  - **Tier 2 (Order Level)**: Falls back to the root `order.measurements`.
  - **Tier 3 (Contact Level)**: Falls back to `order.contact.measurements` if none are found in the direct order footprint.
- **UI Architecture**: Deeply integrated these fallbacks into the dark expansion panel to dynamically segregate measurements into '👘 FILIPINA', '👖 PANTALÓN' and 'MEDIDAS' sections depending on the garment context and the payload structure.

## [2026-09-15] - Workshop Production Drawer UI Encapsulation
- **Feature**: Redesigned the Custom Measurement grid inside the Production drawer to fix label collisions (specifically the "PECHO/TORSO" truncation).
- **Design Execution**:
  - Replaced the simple floating text layout with a strict, 4-column **Encapsulated Micro-Tile Grid**.
  - Expanded the container boundaries (`min-w-[320px] sm:min-w-[380px]`) and applied a `.truncate` modifier mapping labels inside clean, independent bounding boxes. 
  - Standardized the label format, safely truncating "Pecho/Torso" down to "Pecho" across the 8-point layout matrix.
- **Rule Adherence**: Completed all structural layout refactoring entirely within the existing bounds of `ProductionView.tsx`, leaving the file at an optimal 297 lines (Zero rule breakage).

## [2026-09-15] - Workshop Production Fluid Density Update
- **Feature**: Re-architected the layout density of `ProductionView.tsx` to display multiple Workshop orders horizontally across desktop/laptop views while drastically reducing vertical bloat on mobile.
- **Design Execution**:
  - **Multi-Card Grid**: Compressed the master production cards (adjusting padding from `p-8` down to `p-4`) and shifted them into a dense matrix (`lg:grid-cols-2 xl:grid-cols-3`). This allows Doña Doris to see up to 6 orders simultaneously on wide screens.
  - **Ultra-Compact Header**: Minified the entire order header (Customer Name, Status Badge, and Action Buttons) into a single, tightly-wrapping horizontal bar. Action buttons were aggressively shrunk (from `py-3` to `py-1.5`, locking height to `h-8`). 
  - **Fluid Measurement Drawer**: Discarded all fixed boundaries. The 3-Tier measurement engine now dynamically flows into `grid-cols-2` on mobile portrait (safeguarding labels) and `grid-cols-4` on wider viewports. A single garment + drawer now comfortably fits inside 360px vertical height.
- **Rule Adherence**: The UI refactoring was accomplished flawlessly within the existing file, staying exactly at 294 lines long (0 TS errors).

## [2026-09-15] - Workshop Production Dual-Mode Architecture
- **Feature**: Re-architected `ProductionView.tsx` into a highly responsive dual-mode layout.
- **Design Execution**:
  - **Desktop / Laptop Mode (`lg+`)**: Completely replaced the card grid with a Gmail-style Row Ledger. Doña Doris can now view up to 15 orders strictly categorized into a 6-column full-width table. Measurement expansions appear as clean, inline horizontal data rows beneath the garments without truncating labels.
  - **Mobile Portrait Mode (`< sm`)**: Re-compressed the header onto a single horizontal line alongside the action buttons, ensuring the customer's name remains visible when interacting with the 2-column measurement grid.
  - **Mobile Landscape Mode**: Intercepted the layout using Tailwind `landscape:` modifiers to spawn a 2-pane split screen. The left pane (35%) holds identity and action buttons; the right pane (65%) holds the scrolling measurement grids, capping the entire card's vertical height below 300px to eradicate vertical scrolling.
- **UI Architecture Update**: Refined the Mobile Landscape implementation of `ProductionView.tsx`. Replaced the previous 35/65 column split with a strict 2-Row Stacked Layout constraint. 
  - **Row 1**: Anchors the customer identity, status badge, garment summary, and full suite of action buttons on a single horizontal axis.
  - **Row 2**: Deploys a full-width measurement drawer beneath the action row, utilizing `grid-cols-4` for Filipina blocks and `grid-cols-2` for Pantalón blocks to maximize specification data density.
  - **Constraints**: Maintained absolute isolation; the Desktop Row Ledger and Mobile Portrait models remain completely untouched, ensuring zero regressions while capping the landscape UI height at 320px.
- **UI Architecture Update**: Applied Pass 1 to the mobile card layout in `ProductionView.tsx`.
  - Replaced the separate Portrait/Landscape layouts with a single responsive layout for `< lg` screens.
  - Implemented the requested Natural Container Height, removing fixed `h-[320px]` voids.
  - Refined the Two-Tier Header: 
    - Row A explicitly displays the full customer name (no truncate) alongside the status badge.
    - Row B groups the garment summary and all primary action buttons for that specific item.
  - Reduced the `ProductionView.tsx` file size to 399 lines, comfortably beneath the 500-line Rule 300/500 limit.
  - Desktop row ledger layout remains 100% untouched.
- **UI Architecture Update**: Updated mobile card drawer container classes in `ProductionView.tsx`.
  - Configured drawer wrapper padding to `p-2.5 sm:p-3` for responsive spacing.
  - Wrapped Filipina and Pantalón measurement blocks in a side-by-side grid (`grid grid-cols-1 sm:grid-cols-2 gap-3 w-full`).
  - Maintained zero TypeScript errors and confirmed compliance with Rule 300/500 (399 lines).
- **UI Architecture Update**: Applied mobile portrait responsive breakpoint refinements in `ProductionView.tsx`.
  - Refactored Secondary Utility Row (Row B) with `flex-col sm:flex-row landscape:flex-row items-start sm:items-center landscape:items-center justify-between`:
    - Garment title now takes full width in portrait with `whitespace-normal leading-tight`, completely eliminating 'U..' truncation while staying inline in landscape.
    - Action controls align to the right across the full row on mobile portrait and remain inline in landscape.
  - Measurement Tiles:
    - Updated Filipina and Pantalón grid to `grid-cols-2 sm:grid-cols-4 landscape:grid-cols-4 gap-1.5 w-full`.
    - Refactored micro-tile labels to `text-[9px] font-bold text-stone-400 uppercase whitespace-normal leading-tight block`, wrapping multi-word labels cleanly across two lines without ellipses.
  - Preserved 100% of single-screen mobile landscape view and desktop ledger layout untouched.
  - Maintained strict Rule 500 compliance (419 lines) with 0 TypeScript diagnostics (`tsc --noEmit`).
