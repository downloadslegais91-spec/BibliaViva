import './env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/auth/google/callback', (req, res) => {
  const credential = req.body.credential;
  if (credential) {
    res.redirect(`/login.html?credential=${encodeURIComponent(credential)}`);
  } else {
    res.redirect('/login.html?error=missing_credential');
  }
});

app.use('/api', routes);

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../../icon-512.png'));
});

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

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin.html'));
});

app.use(errorHandler);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;

