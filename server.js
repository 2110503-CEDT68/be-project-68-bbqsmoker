const express = require('express');
const dotenv = require('dotenv');
const cookieParser=require('cookie-parser');
dotenv.config({ path: './config/config.env' });
const companies = require ('./routes/companies');
const auth = require('./routes/auth');
const bookings =require('./routes/bookings');
const connectDB = require('./config/db');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const rateLimit=require('express-rate-limit');
const {xss}=require('express-xss-sanitizer');
const hpp=require('hpp');
const cors=require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
connectDB();

const app = express();
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // Limit each IP to 100 requests per `window` (here, per 10 minutes)
});
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Library API",
      version: "1.0.0",
      description: "A Job Fair Registration ",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
      },
    ],
  },
  apis: ["./routes/*.js"],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
//app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());
app.use (cookieParser());
app.set('query parser', 'extended');
app.use('/api/v1/companies', companies);
app.use('/api/v1/auth',auth);
app.use('/api/v1/bookings', bookings);
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err,promise)=>{
console.log(`Error: ${err.message}`); 
  server.close(()=> process.exit(1));
});