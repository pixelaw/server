import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const port: number = 3001;

// Serve static files from the /static directory
app.use('/', express.static(path.join(__dirname, 'static')));


app.listen(port, () => {
  console.log(`Webserver listening on port ${port}`);
});

