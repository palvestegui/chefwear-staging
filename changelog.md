## [Unreleased]
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
