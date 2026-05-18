import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// Serve PWA static files from project root
app.use(express.static(path.join(__dirname, '../..'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Service-Worker-Allowed', '/');
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../login.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '../../registro.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
