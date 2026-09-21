import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-0dba6e4d-b474-410e-b078-6e631bf1a01a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fix() {
  const querySnapshot = await getDocs(collection(db, "orders"));
  let fixed = 0;
  for (const document of querySnapshot.docs) {
    const data = document.data();
    if (data.migrationFlatDiscount > 0 && data.totalPrice !== undefined) {
      // If the totalPrice doesn't reflect the discount, fix it!
      const expectedTotal = data.subtotal - data.migrationFlatDiscount;
      // Also maybe totalDiscount is wrong?
      const expectedTotalDiscount = data.migrationFlatDiscount;
      
      if (Math.abs(data.totalPrice - expectedTotal) > 0.01 || data.totalPrice > data.subtotal) {
        console.log(`Fixing order ${document.id}: subtotal=${data.subtotal}, totalPrice=${data.totalPrice}, discount=${data.migrationFlatDiscount}`);
        await updateDoc(doc(db, "orders", document.id), {
          totalPrice: expectedTotal,
          totalDiscount: expectedTotalDiscount
        });
        fixed++;
      }
    }
  }
  console.log(`Fixed ${fixed} orders.`);
}

fix().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
