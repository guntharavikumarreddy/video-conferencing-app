import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// --- AUTHENTICATION ROUTES ---
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(400).json({ error: "User already exists or valid data required." });
    }
});

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// --- FILE SHARING ROUTES ---
app.post("/api/upload", upload.single("file"), async (req, res) => {
    const file = req.file;
    const { uploaderId, meetingId } = req.body;

    if (!file || !uploaderId)
        return res.status(400).json({ error: "File and uploader ID required." });

    // Generate unique 6-char API key
    const accessKey = uuidv4().substring(0, 6).toUpperCase();

    const dbFile = await prisma.fileShare.create({
        data: {
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            accessKey,
            uploaderId,
            meetingId: meetingId || null
        }
    });
    res.json({ success: true, file: dbFile });
});

app.get("/api/download/:key", async (req, res) => {
    const file = await prisma.fileShare.findUnique({ where: { accessKey: req.params.key } });
    if (!file) return res.status(404).json({ error: "File not found or invalid key." });

    res.download(file.path, file.originalName);
});

// --- ADMIN ROUTES ---
app.get("/api/admin/data", async (req, res) => {
    // Normally add JWT admin verification middleware here
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    const files = await prisma.fileShare.findMany();
    const meetings = await prisma.meeting.findMany();
    res.json({ users, files, meetings });
});

// --- SOCKET.IO SIGNALING ---
const rooms: Record<string, string[]> = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        if (!rooms[roomId]) rooms[roomId] = [];
        rooms[roomId].push(socket.id);

        // Notify others in room
        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            if (rooms[roomId]) {
                rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            }
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });

    // Signaling
    socket.on("offer", (payload) => {
        io.to(payload.target).emit("offer", payload);
    });
    socket.on("answer", (payload) => {
        io.to(payload.target).emit("answer", payload);
    });
    socket.on("ice-candidate", (incoming) => {
        io.to(incoming.target).emit("ice-candidate", incoming);
    });

    // Chat messaging
    socket.on("send-message", (roomId, message) => {
        socket.to(roomId).emit("receive-message", message);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
