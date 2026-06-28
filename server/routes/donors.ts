import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin.js';
import { BloodDonor } from '../../src/types.js';

const router = Router();
const collectionName = 'blood_donors';

router.get('/', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(collectionName).get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    res.status(500).json({ error: `Failed to fetch ${collectionName}` });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(collectionName).doc(id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(`Error fetching ${collectionName} by ID:`, error);
    res.status(500).json({ error: `Failed to fetch ${collectionName}` });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body as Partial<BloodDonor>;
    
    if (!data.fullName || !data.contactPhone || !data.state || !data.bloodType || !data.status) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    data.createdAt = data.createdAt || Date.now();

    const docRef = await db.collection(collectionName).add(data);
    res.status(201).json({ id: docRef.id, message: 'Created successfully', data: { id: docRef.id, ...data } });
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    res.status(500).json({ error: `Failed to create ${collectionName}` });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    await db.collection(collectionName).doc(id).update(updateData);
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    res.status(500).json({ error: `Failed to update ${collectionName}` });
  }
});

export default router;
