import dotenv from 'dotenv';
import app from './app';
import logger from './lib/logger';

dotenv.config();

const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
