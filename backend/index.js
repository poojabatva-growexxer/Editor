import 'dotenv/config';
import app from './src/app.js';
import {prisma} from './lib/prisma.js';

const PORT = process.env.PORT || 3000;

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});