import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
const prisma = new PrismaClient();
const PORT = 3001;

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ensure upload directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * --- HELPER: Identify ID Type (String vs Int) ---
 * Prevents crashes if your DB uses Integer IDs vs UUID Strings.
 */
const getSafeId = (id) => (isNaN(id) ? id : parseInt(id));

/**
 * --- HELPER: Create Audit Entry ---
 * Centralized function to record system activity.
 */
const logAction = async (action, details, user) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        user: user || "System Action",
      }
    });
  } catch (err) {
    console.error("❌ Audit Logging Failed:", err.message);
  }
};

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 1. GET ALL AUDIT LOGS (For Admin Review)
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 150 
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// 2. Metadata Routes (Substations, Elements, Staff)
app.get('/api/substations', async (req, res) => {
  try {
    const stations = await prisma.substation.findMany({ orderBy: { name: 'asc' } });
    res.json(stations);
  } catch (error) { res.status(500).json({ error: "Failed to fetch stations" }); }
});

app.get('/api/elements', async (req, res) => {
  try {
    const elements = await prisma.element.findMany({ orderBy: { name: 'asc' } });
    res.json(elements);
  } catch (error) { res.status(500).json({ error: "Failed to fetch elements" }); }
});

app.get('/api/creators', async (req, res) => {
  try {
    const creators = await prisma.creator.findMany({ orderBy: { name: 'asc' } });
    res.json(creators);
  } catch (error) { res.status(500).json({ error: "Failed to fetch creators" }); }
});

// 3. POST Trip (Create Incident)
app.post('/api/trips', async (req, res) => {
  const { title, createdBy, elementType, trippingDateTime, restorationDateTime, fromSubstationId, toSubstationId, operatorName } = req.body;
  try {
    const newTrip = await prisma.trip.create({
      data: {
        title,
        elementName: title,
        createdBy,
        elementType: elementType || "Transmission Line",
        trippingDateTime: new Date(trippingDateTime),
        restorationDateTime: restorationDateTime ? new Date(restorationDateTime) : null,
        fromSubstationId,
        toSubstationId,
        status: "OPENED"
      }
    });
    await logAction("CREATE_INCIDENT", `Incident created for element: ${title}`, operatorName);
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(500).json({ error: "Creation failed" });
  }
});

// 4. GET Trips
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      include: { 
        fromSubstation: true, 
        toSubstation: true 
      },
      orderBy: { trippingDateTime: 'desc' }
    });
    res.json(trips);
  } catch (error) { res.status(500).json({ error: "Fetch records failed" }); }
});

// 5. FILE UPLOAD (With Logging)
app.post('/api/upload-report', upload.single('reportFile'), async (req, res) => {
  const { tripId, reportType, stationSide, username } = req.body;
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const prefix = stationSide === 'A' ? 'from' : 'to';
    const columnToUpdate = `${prefix}${reportType.toUpperCase()}`;

    const updatedTrip = await prisma.trip.update({
      where: { id: getSafeId(tripId) },
      data: { [columnToUpdate]: req.file.filename }
    });

    await logAction("UPLOAD_FILE", `Uploaded ${reportType} (Side ${stationSide}) for ${updatedTrip.title}`, username);
    res.json({ success: true, updatedTrip });
  } catch (error) {
    res.status(500).json({ error: "Upload failed" });
  }
});

// 6. DELETE SINGLE FILE (With Logging)
app.delete('/api/delete-report/:id', async (req, res) => {
  const { id } = req.params;
  const { fieldName, username } = req.body;
  try {
    const safeId = getSafeId(id);
    const trip = await prisma.trip.findUnique({ where: { id: safeId } });
    
    if (trip?.[fieldName]) {
      const filePath = path.join(process.cwd(), 'uploads', trip[fieldName]);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    await prisma.trip.update({
      where: { id: safeId },
      data: { [fieldName]: null }
    });

    await logAction("DELETE_FILE", `Deleted ${fieldName} from incident: ${trip.title}`, username);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "File deletion failed" });
  }
});

// 7. STATUS UPDATES (Close/Reopen)
app.patch('/api/trips/:id', async (req, res) => {
  const { username, status } = req.body;
  const { id } = req.params;
  try {
    const safeId = getSafeId(id);
    const updatedTrip = await prisma.trip.update({
      where: { id: safeId },
      data: { status: status }
    });
    
    await logAction("STATUS_CHANGE", `Incident ${updatedTrip.title} marked as ${status}`, username);
    res.json(updatedTrip);
  } catch (error) { 
    res.status(500).json({ error: "Status update failed" }); 
  }
});

// 8. FULL INCIDENT DELETE (With File Cleanup)
app.delete('/api/trips/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  try {
    const safeId = getSafeId(id);
    const trip = await prisma.trip.findUnique({ where: { id: safeId } });
    if (!trip) return res.status(404).json({ error: "Incident not found" });

    // Cleanup physical files from server
    const fileFields = ['fromFIR', 'fromDR', 'fromEL', 'toFIR', 'toDR', 'toEL'];
    fileFields.forEach(field => {
      if (trip[field]) {
        const fPath = path.join(process.cwd(), 'uploads', trip[field]);
        if (fs.existsSync(fPath)) fs.unlinkSync(fPath);
      }
    });

    await prisma.trip.delete({ where: { id: safeId } });
    await logAction("DELETE_INCIDENT", `Permanently deleted incident record: ${trip.title}`, username);
    res.json({ success: true });
  } catch (error) { 
    res.status(500).json({ error: "Incident deletion failed" }); 
  }
});

// 9. LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ 
        success: true, 
        username: user.username, 
        role: user.role, 
        substationId: user.substationId 
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) { 
    res.status(500).json({ error: "Login error" }); 
  }
});
// --- PASSWORD RESET ENDPOINT ---
app.post('/api/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ error: "Username and New Password are required" });
  }

  try {
    // 1. Hash the new password for security
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 2. Update the password in the database
    const updatedUser = await prisma.user.update({
      where: { username: username },
      data: { password: hashedPassword }
    });

    // 3. Create an Audit Log entry for the security trail
    await logAction(
      "PASSWORD_RESET", 
      `Password successfully updated for account: ${username}`, 
      username
    );

    res.json({ success: true, message: "Password updated in database." });
  } catch (error) {
    console.error("Database Update Error:", error);
    res.status(500).json({ error: "Failed to update password in database." });
  }
});

app.listen(PORT, () => console.log(`🚀 BPSO Server active on http://localhost:${PORT}`));