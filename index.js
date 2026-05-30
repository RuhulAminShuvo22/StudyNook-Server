

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());

// ===================== DB CONNECTION =====================
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// ===================== MAIN FUNCTION =====================
async function run() {
  try {
    await client.connect();
    console.log("✅ MongoDB Connected!");

    const db = client.db("studynook");

    const roomsCollection = db.collection("rooms");
    const usersCollection = db.collection("user");
    const bookingsCollection = db.collection("bookings");

    // =====================================================
    // CREATE ROOM
    // =====================================================
    app.post("/rooms", async (req, res) => {
      try {
        const roomData = req.body;

        // 🔐 VALIDATION
        if (!roomData.ownerEmail || !roomData.roomName) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields",
          });
        }

        const result = await roomsCollection.insertOne({
          ...roomData,
          bookingCount: 0,
          createdAt: new Date(),
        });

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Add Room Error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to add room",
        });
      }
    });

    // =====================================================
    // GET ALL ROOMS
    // =====================================================
    app.get("/rooms", async (req, res) => {
      try {
        const result = await roomsCollection.find().toArray();
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Failed to fetch rooms",
        });
      }
    });

    //===========================================
    //middleware
    //===========================================


    // =====================================================
    // GET SINGLE ROOM
    // =====================================================
    app.get("/rooms/:id", (req, res, next)=>{
      const header = req.headers.authorization
      // console.log(header)
      if(header === "logged in"){
        next()
      }
      else{
        res.status(401).json({message: "You are not Logged in"})
      }
      
    } ,  async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ID",
          });
        }

        const result = await roomsCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Room not found",
          });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Error fetching room",
        });
      }
    });

    // =====================================================
    // UPDATE ROOM
    // =====================================================
    app.put("/rooms/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedRoom = req.body;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid ID",
          });
        }

        const result = await roomsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...updatedRoom,
            },
          },
        );

        res.json({
          success: true,
          message: "Room updated",
          result,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Update failed",
        });
      }
    });

    // =====================================================
    // DELETE ROOM
    // =====================================================
    app.delete("/rooms/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await roomsCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.json({
          success: true,
          message: "Room deleted",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Delete failed",
        });
      }
    });

    // =====================================================
    // USERS
    // =====================================================
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.json(result);
    });

    app.get("/users/:id", async (req, res) => {
      const result = await usersCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(result);
    });

    app.put("/users/:id", async (req, res) => {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body },
      );

      res.json(result);
    });

    // =====================================================
    // BOOKINGS
    // =====================================================
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;

        const { roomId, bookingDate, startTime, endTime } = booking;

        const conflict = await bookingsCollection.findOne({
          roomId,
          bookingDate,
          status: "confirmed",
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        });

        if (conflict) {
          return res.status(400).json({
            success: false,
            message: "Time slot already booked",
          });
        }

        const result = await bookingsCollection.insertOne({
          ...booking,
          status: "confirmed",
          createdAt: new Date(),
        });

        await roomsCollection.updateOne(
          { _id: new ObjectId(roomId) },
          { $inc: { bookingCount: 1 } },
        );

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Booking failed",
        });
      }
    });

    // MY BOOKINGS
    app.get("/bookings/user/:email", async (req, res) => {
      const result = await bookingsCollection
        .find({ userEmail: req.params.email })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(result);
    });

    // CANCEL BOOKING
    app.patch("/bookings/:id/cancel", async (req, res) => {
      const booking = await bookingsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!booking) {
        return res.status(404).json({ message: "Not found" });
      }

      await bookingsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status: "cancelled" } },
      );

      await roomsCollection.updateOne(
        { _id: new ObjectId(booking.roomId) },
        { $inc: { bookingCount: -1 } },
      );

      res.json({ success: true });
    });

    // GET ROOMS BY USER EMAIL
    app.get("/rooms/user/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const result = await roomsCollection
          .find({ ownerEmail: email })
          .toArray();

        res.status(200).json(result);
      } catch (error) {
        console.error("Fetch user rooms error:", error);

        res.status(500).json({
          success: false,
          message: "Failed to fetch user rooms",
        });
      }
    });

    // =====================================================
    // HEALTH CHECK
    // =====================================================
    await client.db("admin").command({ ping: 1 });
    console.log("🚀 MongoDB Ping Success!");
  } catch (error) {
    console.error("DB Error:", error);
  }
}

run().catch(console.dir);

// ===================== ROOT =====================
app.get("/", (req, res) => {
  res.send("🚀 Server Running!");
});

// ===================== START =====================//
app.listen(PORT, () => {
  console.log(`🔥 Server running on ${PORT}`);
});
