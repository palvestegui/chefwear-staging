import re

# 1. NewOrderModal.tsx
with open('src/components/modals/NewOrderModal.tsx', 'r') as f:
    c2 = f.read()

c2 = re.sub(
    r"(getOrderBreakdown\s*)= usePricingEngine\(pricing\);",
    r"\1, getServiceUnitPrice } = usePricingEngine(pricing);",
    c2
)
if "getServiceUnitPrice } = usePricingEngine(pricing);" not in c2:
    c2 = re.sub(r"getOrderBreakdown", "getOrderBreakdown, getServiceUnitPrice", c2, count=1)

with open('src/components/modals/NewOrderModal.tsx', 'w') as f:
    f.write(c2)

# 2. InvoiceModal.tsx
with open('src/components/modals/InvoiceModal.tsx', 'r') as f:
    c5 = f.read()

if "const { getServiceUnitPrice } = usePricingEngine(pricing);" not in c5:
    c5 = c5.replace("if (!viewingInvoice) return null;", "if (!viewingInvoice) return null;\n  const { getServiceUnitPrice } = usePricingEngine(pricing);")

with open('src/components/modals/InvoiceModal.tsx', 'w') as f:
    f.write(c5)

