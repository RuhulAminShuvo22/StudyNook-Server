const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const {
  MongoClient,
  ServerApiVersion,
} = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = process.env.MONGODB_URI;

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    await client.connect();

    console.log("✅ MongoDB Connected!");

    // Database + Collection
    const db = client.db("studynook");
    const roomsCollection = db.collection("rooms");

    // Add Room API
    app.post("/rooms", async (req, res) => {

      try {

        const roomData = req.body;

        const result =
          await roomsCollection.insertOne(roomData);

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

    // Ping Check
    await client.db("admin").command({
      ping: 1,
    });

    console.log("🚀 MongoDB Ping Success!");

  } catch (error) {

    console.error(error);
  }
}

run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("🚀 Server Running!");
});

// Server Start
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});