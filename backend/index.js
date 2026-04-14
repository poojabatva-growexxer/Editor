import 'dotenv/config';
import app from './src/app.js';
import {prisma} from './lib/prisma.js';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected");
 
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err);
    process.exit(1);
  }
}
 
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
 
start();