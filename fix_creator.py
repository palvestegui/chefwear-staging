with open('src/hooks/useOrderCreator.ts', 'r') as f:
    c = f.read()

if "getServiceUnitPrice: pricingEngine.getServiceUnitPrice" not in c:
    c = c.replace("getOrderBreakdown: pricingEngine.getOrderBreakdown", "getOrderBreakdown: pricingEngine.getOrderBreakdown,\n    getServiceUnitPrice: pricingEngine.getServiceUnitPrice")

with open('src/hooks/useOrderCreator.ts', 'w') as f:
    f.write(c)

