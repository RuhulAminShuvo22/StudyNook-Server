const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Import MongoClient, ServerApiVersion, and ObjectId from mongodb package
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Application Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = process.env.MONGODB_URI;

// Initialize Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Establish connection to MongoDB server
    await client.connect();
    console.log("✅ MongoDB Connected!");

    // Initialize Database and Collections
    const db = client.db("studynook");
    const roomsCollection = db.collection("rooms");

    // 1. Add New Room Specification API (POST)
    app.post("/rooms", async (req, res) => {
      try {
        const roomData = req.body;
        const result = await roomsCollection.insertOne(roomData);
        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Failed to add room",
        });
      }
    });

    // 2. Fetch All Available Rooms API (GET)
    app.get("/rooms", async (req, res) => {
      try {
        const result = await roomsCollection.find().toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch rooms data",
        });
      }
    });

    // 3. Fetch Single Dynamic Room Specification by Document ID API (GET)
    // This route eliminates the 404 and 'Unexpected token <' parsing syntax error in frontend console
    app.get("/rooms/:id", async (req, res) => {
        try {
            const id = req.params.id;

            // Security logic to validate if the incoming parameter is a valid 24-character hexadecimal string
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: "Invalid Room ID format" });
            }

            // Convert string parameters into valid MongoDB ObjectId format
            const query = { _id: new ObjectId(id) }; 
            const result = await roomsCollection.findOne(query);

            if (!result) {
                return res.status(404).json({ success: false, message: "Room not found inside database" });
            }

            res.status(200).json(result); 
        } catch (error) {
            console.error("Error fetching single room dynamic data:", error);
            res.status(500).json({ success: false, message: "Failed to fetch room details" });
        }
    });

    // Send a ping command to verify deployment connection
    await client.db("admin").command({
      ping: 1,
    });

    console.log("🚀 MongoDB Ping Success!");
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

// Server Root Route Checker
app.get("/", (req, res) => {
  res.send("🚀 Server Running!");
});

// Start Express Server Engine Listening Port//
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
