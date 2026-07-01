import { query, where, getDocs, collection, writeBatch, doc } from 'firebase/firestore';
import { createCrud, CrudApi } from './crud';
import { SupplyInventory, SupplyRequest } from '../types';
import { db } from '../firebase';

export const supplyInventoryApi: CrudApi<SupplyInventory> = createCrud<SupplyInventory>('supply_inventory');

export const supplyRequestsApi: CrudApi<SupplyRequest> & {
  deliver: (requestId: string, items: SupplyRequest['items']) => Promise<void>;
} = {
  ...createCrud<SupplyRequest>('supply_requests'),

  deliver: async (requestId, items) => {
    const batch = writeBatch(db);

    const itemNames = [...new Set(items.map(i => i.itemName))];
    const q = query(collection(db, 'supply_inventory'), where('itemName', 'in', itemNames));
    const snap = await getDocs(q);
    const invMap = new Map(snap.docs.map(d => [d.data().itemName, d]));

    for (const item of items) {
      const invDoc = invMap.get(item.itemName);
      if (invDoc) {
        const currentQty = invDoc.data().quantity || 0;
        batch.update(doc(db, 'supply_inventory', invDoc.id), {
          quantity: Math.max(0, currentQty - item.quantityRequested),
        });
      }
    }

    batch.update(doc(db, 'supply_requests', requestId), {
      status: 'Entregado',
      deliveredAt: Date.now(),
    });

    await batch.commit();
  },
};
