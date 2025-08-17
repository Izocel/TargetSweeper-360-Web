import express from 'express';
import apiRouter from './routes/index';
import { DataStore } from './utils/Datastore';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());
// Middleware to serve API routes
app.use('/api', apiRouter);
// Serve static files from the data directory
app.use('/data', express.static(DataStore.basePath));

app.listen(PORT, () => {
    console.log(`Express Server running on port ${PORT}`);
});
