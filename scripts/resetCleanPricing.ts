import { doc, setDoc, deleteField, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

const CANONICAL_8_WORKSHOP_GARMENTS = {
  "Camisa de servicio (mesas)": {
    "Cristal": { priceB2B: 140, priceRaleo: 140 },
    "Drill mixto 62/38": { priceB2B: 136, priceRaleo: 136 }
  },
  "Chamarra Aventurera": {
    "Drill de 8oz": { priceB2B: 280, priceRaleo: 280 },
    "Gabardina de 1ra": { priceB2B: 250, priceRaleo: 250 },
    "Jeans Rígido": { priceB2B: 280, priceRaleo: 280 },
    "Softshell": { priceB2B: 300, priceRaleo: 300 },
    "Tornado (Bull Denim)": { priceB2B: 300, priceRaleo: 300 }
  },
  "Chamarra Ecuestre personalizada": {
    "10 oz Cotton Canvas": { priceB2B: 700, priceRaleo: 700 },
    "Tocuyo": { priceB2B: 500, priceRaleo: 500 },
    "Tornado (Bull Denim)": { priceB2B: 600, priceRaleo: 600 }
  },
  "Filipina": {
    "Drill de 6oz": { priceB2B: 198, priceRaleo: 220 },
    "Drill de 8oz": { priceB2B: 198, priceRaleo: 220 },
    "Gabardina de 1ra": { priceB2B: 171, priceRaleo: 190 },
    "Gabardina de 2da": { priceB2B: 171, priceRaleo: 186 },
    "Tornado (Bull Denim)": { priceB2B: 207, priceRaleo: 230 }
  },
  "Gorro": {
    "Drill de 6oz": { priceB2B: 30.6, priceRaleo: 34 },
    "Drill de 8oz": { priceB2B: 30.6, priceRaleo: 34 },
    "Gabardina de 2da": { priceB2B: 26.1, priceRaleo: 29 }
  },
  "Mandil": {
    "Drill de 6oz": { priceB2B: 117, priceRaleo: 130 },
    "Drill de 8oz": { priceB2B: 117, priceRaleo: 130 },
    "Gabardina de 1ra": { priceB2B: 99, priceRaleo: 110 },
    "Gabardina de 2da": { priceB2B: 90, priceRaleo: 100 },
    "Tornado (Bull Denim)": { priceB2B: 135, priceRaleo: 150 }
  },
  "Pantalón": {
    "Drill de 6oz": { priceB2B: 148, priceRaleo: 165 },
    "Drill de 8oz": { priceB2B: 148, priceRaleo: 165 },
    "Gabardina de 1ra": { priceB2B: 125, priceRaleo: 139 },
    "Gabardina de 2da": { priceB2B: 139, priceRaleo: 139 },
    "Tornado (Bull Denim)": { priceB2B: 162, priceRaleo: 180 }
  },
  "Regulador para correas cruzadas": {
    "Argolla de metal": { priceB2B: 20, priceRaleo: 20 },
    "Cuero": { priceB2B: 25, priceRaleo: 25 }
  }
};

async function reset() {
  console.log('Restableciendo Staging pricing/global al estado limpio original...');
  const ref = doc(db, 'pricing', 'global');
  await setDoc(ref, { garments: deleteField() }, { merge: true });
  await setDoc(ref, {
    garments: CANONICAL_8_WORKSHOP_GARMENTS,
    catalogGarments: deleteField(),
    lastSyncedAt: Date.now()
  }, { merge: true });
  
  const snap = await getDoc(ref);
  const data = snap.data();
  console.log('Garments count:', Object.keys(data?.garments || {}).length);
  console.log('Garments keys:', Object.keys(data?.garments || {}));
  console.log('CatalogGarments present:', 'catalogGarments' in (data || {}));
  console.log('Services count:', Object.keys(data?.services || {}).length);
  console.log('SpecialPresets present:', 'specialPresets' in (data || {}));
  console.log('SUCCESS: Staging pricing/global restablecido al estado limpio original.');
  process.exit(0);
}

reset();
