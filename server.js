const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');  // To hash passwords
const cors = require('cors');  // Allow frontend to connect
const port = 3019;
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(express.static(__dirname));  // Serve static files from the root directory
app.use(express.urlencoded({ extended: true }));  
app.use(express.json());  
app.use(cors({
    origin: '*',
    credentials: true
}));  // Allow frontend requests

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/classes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true }
});

const Users = mongoose.model("Users", userSchema);

// Serve Pages - Add explicit routes for all HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ✅ Signup Route
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await Users.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({ email, password: hashedPassword });

    await newUser.save();
    console.log("✅ User signed up successfully");

    res.json({ redirect: "/login.html" });  // Redirect to login page
  } catch (err) {
    console.error("❌ Error signing up:", err);
    res.status(500).json({ error: "Error signing up." });
  }
});

// ✅ Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Received login request:", email, password);

  try {
    const user = await Users.findOne({ email });
    console.log("🔍 Fetched user from DB:", user);

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match:", isMatch);

    if (isMatch) {
      console.log("✅ User logged in successfully");
      const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
      res.json({ 
        message: 'Login successful', 
        token,
        username: user.username
      });
    } else {
      console.log("❌ Incorrect password");
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error("❌ Error logging in:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pose Estimation Schema and Routes
const poseSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    poseLandmarks: [{
        x: Number,
        y: Number,
        z: Number,
        visibility: Number
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }
});

const PoseData = mongoose.model('PoseData', poseSchema);

// Save pose data endpoint
app.post('/savePoseData', async (req, res) => {
    try {
        const { poseLandmarks } = req.body;
        
        if (!poseLandmarks || !Array.isArray(poseLandmarks)) {
            return res.status(400).json({ error: 'Invalid pose data format' });
        }

        const pose = new PoseData({
            poseLandmarks: poseLandmarks.map(landmark => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z,
                visibility: landmark.visibility
            }))
        });

        await pose.save();
        console.log('✅ Pose data saved successfully');
        res.json({ message: 'Pose data saved successfully', timestamp: pose.timestamp });
    } catch (error) {
        console.error('❌ Error saving pose data:', error);
        res.status(500).json({ error: 'Error saving pose data' });
    }
});

// Get pose data endpoint
app.get('/getPoseData', async (req, res) => {
    try {
        const poseData = await PoseData.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(poseData);
    } catch (error) {
        console.error('❌ Error fetching pose data:', error);
        res.status(500).json({ error: 'Error fetching pose data' });
    }
});

// Start Server
app.listen(port, () => console.log(`🚀 Server started on port ${port}`));
