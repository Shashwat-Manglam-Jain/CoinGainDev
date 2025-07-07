const express = require('express');
const http = require('http'); 
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const { setupSocket } = require("./socket");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());

// Parse incoming JSON and URL-encoded data with increased limits
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/fetchdata', require('./routes/adminRoutes'));
app.use('/Userfetch', require('./routes/userRoutes'));
app.use('/superadmin', require('./routes/SuperAdminRoutes'));

setupSocket(server);
// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
