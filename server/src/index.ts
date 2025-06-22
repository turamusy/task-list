import express from 'express';
import cors from 'cors';
import listRoutes from './routes/list-routes';

const app = express();
const port: number = 3001;

app.use(cors());
app.use(express.json());
app.use('/api', listRoutes);

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
