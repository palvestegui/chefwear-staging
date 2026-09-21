with open('src/hooks/usePricingEngine.ts', 'r') as f:
    c = f.read()

import re
c = re.sub(r"  const getServiceUnitPrice =.*?};\n\n", "", c, flags=re.DOTALL)
c = c.replace("const getSrvCost = (s: string) => getServiceUnitPrice(s, item);", """const getSrvCost = (s: string) => {
      const srvDef = pricing.services?.find((x: any) => x.name === s);
      if (srvDef?.type === 'Escala de Volumen (Logos)' || (!srvDef && s.toUpperCase().includes('LOGO'))) { 
         return calculateVolumeScaledServiceUnitPrice(item.qty || 1);
      }
      const customPrice = (item.customServicePrices && item.customServicePrices[s] !== undefined) ? Number(item.customServicePrices[s]) : (srvDef?.price || 0);
      return Number(customPrice) || 0;
    };""")
c = c.replace("getItemUnitPrice,\n    getServiceUnitPrice,", "getItemUnitPrice,")

with open('src/hooks/usePricingEngine.ts', 'w') as f:
    f.write(c)
