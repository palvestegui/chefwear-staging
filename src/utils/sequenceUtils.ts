import { db } from '../firebase';
import { doc, runTransaction } from 'firebase/firestore';

export const getNextSequentialQuoteId = async (): Promise<string> => {
  const counterRef = doc(db, 'metadata', 'quoteCounter');
  const nextSeq = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists() && typeof counterDoc.data()?.currentSequence === 'number') {
      current = counterDoc.data().currentSequence;
    }
    const next = current + 1;
    transaction.set(counterRef, { currentSequence: next, updatedAt: new Date().toISOString() }, { merge: true });
    return next;
  });
  return `COT-${String(nextSeq).padStart(4, '0')}`;
};

export const getNextSequentialOrderId = async (): Promise<string> => {
  const counterRef = doc(db, 'metadata', 'orderCounter');
  const nextSeq = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists() && typeof counterDoc.data()?.currentSequence === 'number') {
      current = counterDoc.data().currentSequence;
    }
    const next = current + 1;
    transaction.set(counterRef, { currentSequence: next, updatedAt: new Date().toISOString() }, { merge: true });
    return next;
  });
  return `ORD-${String(nextSeq).padStart(5, '0')}`;
};

export const getNextSequentialCancellationId = async (): Promise<string> => {
  const counterRef = doc(db, 'metadata', 'cancellationCounter');
  const nextSeq = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let current = 0;
    if (counterDoc.exists() && typeof counterDoc.data()?.currentSequence === 'number') {
      current = counterDoc.data().currentSequence;
    }
    const next = current + 1;
    transaction.set(counterRef, { currentSequence: next, updatedAt: new Date().toISOString() }, { merge: true });
    return next;
  });
  return `CNX-${String(nextSeq).padStart(4, '0')}`;
};
