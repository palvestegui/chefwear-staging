with open('src/components/ui/OrderReceiptDocument.tsx', 'r') as f:
    c = f.read()
c = c.replace("import { calculateVolumeScaledServiceUnitPrice }\nimport { usePricingEngine }", "import { calculateVolumeScaledServiceUnitPrice } from '../../utils/pricingCalculator';\nimport { usePricingEngine } from '../../hooks/usePricingEngine';")
with open('src/components/ui/OrderReceiptDocument.tsx', 'w') as f:
    f.write(c)

with open('src/components/modals/InvoiceModal.tsx', 'r') as f:
    c = f.read()
c = c.replace("import { calculateVolumeScaledServiceUnitPrice }\nimport { usePricingEngine }", "import { calculateVolumeScaledServiceUnitPrice } from '../../utils/pricingCalculator';\nimport { usePricingEngine } from '../../hooks/usePricingEngine';")
with open('src/components/modals/InvoiceModal.tsx', 'w') as f:
    f.write(c)
