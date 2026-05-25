
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

// Middleware
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

// Main Function
async function run() {
  try {
    // MongoDB Connect
    await client.connect();

    console.log("✅ MongoDB Connected!");

    // Database
    const db = client.db("studynook");

    // Collections
    const roomsCollection = db.collection("rooms");
    const usersCollection = db.collection("user");

    // =====================================================
    // 1. ADD NEW ROOM API (POST)
    // =====================================================

    app.post("/rooms", async (req, res) => {
      try {
        const roomData = req.body;

        console.log("📦 New Room Data:", roomData);

        const result = await roomsCollection.insertOne(roomData);

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("❌ Add Room Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to add room",
        });
      }
    });

    // =====================================================
    // 2. FETCH ALL ROOMS API (GET)
    // =====================================================

    app.get("/rooms", async (req, res) => {
      try {
        const result = await roomsCollection.find().toArray();

        console.log("✅ Rooms Data Fetched");

        res.status(200).json(result);
      } catch (error) {
        console.error("❌ Fetch Rooms Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch rooms data",
        });
      }
    });

    // =====================================================
    // 3. FETCH SINGLE ROOM BY ID API (GET)
    // =====================================================

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

        // Query
        const query = {
          _id: new ObjectId(id),
        };

        // Find Room
        const result = await roomsCollection.findOne(query);

        // Room Not Found
        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Room not found inside database",
          });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error("❌ Fetch Single Room Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch room details",
        });
      }
    });

    // =====================================================
    // 4. UPDATE ROOM API (PUT)
    // =====================================================

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

        // Updated Data
        const updatedRoom = req.body;

        // Query
        const query = {
          _id: new ObjectId(id),
        };

        // Update Document
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

        // Update Room
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
        console.error("❌ Update Room Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to update room",
        });
      }
    });

    // =====================================================
    // 5. DELETE ROOM API (DELETE)
    // =====================================================

    app.delete("/rooms/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid Room ID format",
          });
        }

        // Query
        const query = {
          _id: new ObjectId(id),
        };

        // Delete Room
        const result = await roomsCollection.deleteOne(query);

        res.status(200).json({
          success: true,
          message: "Room deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("❌ Delete Room Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to delete room",
        });
      }
    });

    // =====================================================
    // 6. FETCH ALL USERS API (GET)
    // =====================================================

    app.get("/users", async (req, res) => {
      try {
        const result = await usersCollection.find().toArray();

        console.log("✅ Users Data:", result);

        res.status(200).json(result);
      } catch (error) {
        console.error("❌ Fetch Users Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch users data",
        });
      }
    });

    // =====================================================
    // 7. FETCH SINGLE USER BY ID API (GET)
    // =====================================================

    app.get("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid User ID format",
          });
        }

        // Query
        const query = {
          _id: new ObjectId(id),
        };

        // Find User
        const result = await usersCollection.findOne(query);

        // User Not Found
        if (!result) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.status(200).json(result);
      } catch (error) {
        console.error("❌ Fetch Single User Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch single user",
        });
      }
    });

    // =====================================================
    // 8. UPDATE USER PROFILE API (PUT)
    // =====================================================

    app.put("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid User ID format",
          });
        }

        // Query
        const query = {
          _id: new ObjectId(id),
        };

        // Update Document
        const updateDoc = {
          $set: {
            name: updatedData.name,
            image: updatedData.image,
          },
        };

        // Update User
        const result = await usersCollection.updateOne(
          query,
          updateDoc
        );

        res.status(200).json({
          success: true,
          message: "User profile updated successfully",
          result,
        });
      } catch (error) {
        console.error("❌ Update User Error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to update user profile",
        });
      }
    });

    // =====================================================
    // MongoDB Ping Test
    // =====================================================

    await client.db("admin").command({
      ping: 1,
    });

    console.log("🚀 MongoDB Ping Success!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

// =====================================================
// Root Route
// =====================================================

app.get("/", (req, res) => {
  res.send("🚀 Server Running!");
});

// =====================================================
// Start Express Server
// =====================================================

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});