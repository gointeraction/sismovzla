import { Router, Request, Response } from 'express';
import { db } from '../firebaseAdmin.js';
import { StructuralEvaluation } from '../../src/types.js';

const router = Router();
const collectionName = 'structural_evaluations';

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
    const data = req.body as Partial<StructuralEvaluation>;
    
    if (!data.formulario_evaluacion_post_sismo) {
      res.status(400).json({ error: 'Missing required fields (formulario_evaluacion_post_sismo)' });
      return;
    }

    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: Date.now()
    });
    res.status(201).json({ id: docRef.id, message: 'Created successfully', data: { id: docRef.id, ...data } });
  } catch (error) {
    console.error(`Error creating ${collectionName}:`, error);
    res.status(500).json({ error: `Failed to create ${collectionName}` });
  }
});

export default router;
