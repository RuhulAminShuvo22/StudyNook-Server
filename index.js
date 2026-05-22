

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

    // ======================================================
    // 1. Add New Room Specification API (POST)
    // ======================================================
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

    // ======================================================
    // 2. Fetch All Available Rooms API (GET)
    // ======================================================
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

    // ======================================================
    // 3. Fetch Single Dynamic Room by ID API (GET)
    // ======================================================
    app.get("/rooms/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Room ID format",
          });
        }

        // Find room by ID
        const query = { _id: new ObjectId(id) };

        const result = await roomsCollection.findOne(query);

        // Room not found
        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Room not found inside database",
          });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching single room dynamic data:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch room details",
        });
      }
    });

    // ======================================================
    // 4. UPDATE ROOM API (PUT)
    // ======================================================
    app.put("/rooms/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Room ID format",
          });
        }

        // Updated room data from frontend
        const updatedRoom = req.body;

        // MongoDB Query
        const query = {
          _id: new ObjectId(id),
        };

        // Updated Fields
        const updateDoc = {
          $set: {
            roomName: updatedRoom.roomName,
            floor: updatedRoom.floor,
            imageUrl: updatedRoom.imageUrl,
            description: updatedRoom.description,
            amenities: updatedRoom.amenities,
            capacity: updatedRoom.capacity,
            hourlyRate: updatedRoom.hourlyRate,
            bookingCount: updatedRoom.bookingCount || 0,
            ownerName: updatedRoom.ownerName,
            ownerEmail: updatedRoom.ownerEmail,
          },
        };

        // Update room in database
        const result = await roomsCollection.updateOne(
          query,
          updateDoc
        );

        res.status(200).json({
          success: true,
          message: "Room updated successfully",
          result,
        });
      } catch (error) {
        console.error("Update Room Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to update room",
        });
      }
    });

    // ======================================================
    // 5. DELETE ROOM API (DELETE)
    // ======================================================
    // app.delete("/rooms/:id", async (req, res) => {
    //   try {
    //     const id = req.params.id;

    //     // Validate MongoDB ObjectId
    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Invalid Room ID format",
    //       });
    //     }

    //     // MongoDB Query
    //     const query = {
    //       _id: new ObjectId(id),
    //     };

        // Delete room
    //     const result = await roomsCollection.deleteOne(query);

    //     res.status(200).json({
    //       success: true,
    //       message: "Room deleted successfully",
    //       deletedCount: result.deletedCount,
    //     });
    //   } catch (error) {
    //     console.error("Delete Room Error:", error);

    //     res.status(500).json({
    //       success: false,
    //       message: "Failed to delete room",
    //     });
    //   }
    // });

    // ======================================================
    // MongoDB Ping Test
    // ======================================================
    await client.db("admin").command({
      ping: 1,
    });

    console.log("🚀 MongoDB Ping Success!");
  } catch (error) {
    console.error(error);
  }
}

run().catch(console.dir);

// ======================================================
// Server Root Route Checker
// ======================================================
app.get("/", (req, res) => {
  res.send("🚀 Server Running!");
});

// ======================================================
// Start Express Server
// ======================================================
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});