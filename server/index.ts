import express from 'express';
import cors from 'cors';

// Rutas
import incidentsRouter from './routes/incidents.js';
import sheltersRouter from './routes/shelters.js';
import peopleRouter from './routes/people.js';
import patientsRouter from './routes/patients.js';
import donorsRouter from './routes/donors.js';
import evaluationsRouter from './routes/evaluations.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Key middleware simple para protección de endpoints de escritura
const requireApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  // Si API_KEY está definido en el .env, validarlo
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    return;
  }
  next();
};

app.use('/api/v1/incidents', requireApiKey, incidentsRouter);
app.use('/api/v1/shelters', requireApiKey, sheltersRouter);
app.use('/api/v1/people', requireApiKey, peopleRouter);
app.use('/api/v1/patients', requireApiKey, patientsRouter);
app.use('/api/v1/donors', requireApiKey, donorsRouter);
app.use('/api/v1/evaluations', requireApiKey, evaluationsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 SismoVzla API Backend running on http://localhost:${PORT}`);
});
