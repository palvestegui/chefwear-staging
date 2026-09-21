> **Reference Audit Source:** Based on the diagnostic findings documented in `AUDIT_REPORT.md`.

# Codebase Remediation & Architecture Plan

## Active Status
- **Current Phase:** Phase 4 (Type Safety Hardening)
- **Active Target File:** Global (Testing)
- **Status:** Pending Execution (Phase 5 - Testing - **Status:** Pending Execution (Task 4.3) Polish)

---

## Phase 1: Zero Hardcoding Enforcement (Critical)
*Objective: Eliminate all literal string matching, hardcoded IDs, and default dictionary values from core calculation engines.*
- [x] **Task 1.1:** Refactor `src/utils/pricingCalculator.ts` to strip hardcoded `ACC-001` and literal `"Estudiante UDI"` checks. Bind pricing tiers exclusively to database-driven attributes.
- [x] **Task 1.2:** Remove literal string matching for `"Uniforme Completo UDI"` in `src/utils/pricingCalculator.ts` and replace with boolean flag evaluations (`item.isPackage`).
- [x] **Task 1.3:** Update `src/utils/discountRulesUtils.ts` to replace hardcoded `'UDI Especial'` preset checks with dynamic rule properties.
- [x] **Task 1.4:** Completely delete `DEFAULT_UDI_PRICES` dictionary from `src/utils/udiPackageUtils.ts` and route pricing data directly through the master product catalog.

## Phase 2: Dead Code & Zombie File Deprecation (High)
*Objective: Purge unlinked modules and orphaned utility functions to reduce long-term technical debt.*
- [x] **Task 2.1:** Delete `src/hooks/useCRMMutations.ts` entirely (unlinked zombie hook).
- [x] **Task 2.2:** Purge orphaned function `syncOrphanedInstitutionalAccountsAndContacts` from `src/utils/accountContactUtils.ts`.
- [x] **Task 2.3:** Remove uncalled validation function `checkQuoteMissingData` from `src/utils/orderUtils.ts`.

## Phase 3: Rule 300 Compliance & Modular Refactoring (Medium)
*Objective: Deconstruct oversized files to comply strictly with the 300/500 line limit rule.*
- [x] **Task 3.1:** Split `src/utils/accountContactUtils.ts` (339 lines) into pure utility functions and separate side-effect mutation handlers.
- [x] **Task 3.2:** Modularize `src/hooks/useOrderCreator.ts` (331 lines) into segregated sub-hooks (`useOrderState` and `useOrderSubmission`).

## Phase 4: Type Safety Hardening (Medium)
*Objective: Eliminate all implicit `any` types across system boundaries.*
- [x] **Task 4.1:** Replace `any` signatures with explicit `Order` and `InvoiceContext` interfaces.
- [ ] **Task 4.2:** Declare strict type contracts for mass iteration arrays (`filteredOrders: any[]`) in `src/utils/csvFormatters.ts`.
- [ ] **Task 4.3:** Audit root `types.ts` to ensure complete coverage for all external data exchange boundaries.