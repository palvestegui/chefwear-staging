export const cleanStr = (s?: string) => (s || '').toLowerCase().trim();

/**
 * Calculates the next sequential Account ID in the format ACC-xxx (e.g. ACC-001, ACC-020).
 */
export const getNextAccountId = (clientAccounts: any[] = []): string => {
  const prefix = 'ACC-';
  let maxNum = 0;

  (clientAccounts || []).forEach(acc => {
    const rawId = String(acc?.accountId || acc?.id || '').trim();
    if (rawId.toUpperCase().startsWith(prefix)) {
      const numPart = rawId.substring(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(3, '0')}`;
};

/**
 * Calculates the next sequential Contact ID in standard CON-0000 format.
 */
export const getNextContactId = (masterContacts: any[] = [], offset: number = 0): string => {
  const prefix = 'CON-';
  let maxNum = 0;

  (masterContacts || []).forEach(contact => {
    const rawId = String(contact?.contactId || contact?.id || '').trim();
    if (rawId.toUpperCase().startsWith(prefix)) {
      const numPart = rawId.substring(prefix.length).replace(/\D.*$/, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  });

  const nextNum = maxNum + 1 + offset;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};
