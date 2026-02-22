import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
