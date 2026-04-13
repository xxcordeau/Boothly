import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-356393ac/health", (c) => {
  return c.json({ status: "ok" });
});

// ========================================
// Photo Booth Session Management
// ========================================

// Create a new session
app.post("/make-server-356393ac/sessions", async (c) => {
  try {
    const body = await c.req.json();
    const { mode, template, printCount, theme } = body;

    if (!mode || !template || !printCount) {
      return c.json({ error: "Missing required fields: mode, template, printCount" }, 400);
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const session = {
      id: sessionId,
      mode,
      template,
      printCount,
      theme: theme || null,
      status: "active", // active, completed, cancelled
      createdAt: new Date().toISOString(),
      photos: [],
    };

    await kv.set(`session:${sessionId}`, session);
    console.log(`✅ Session created: ${sessionId}`);

    return c.json({ success: true, sessionId, session });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    return c.json({ error: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Get session by ID
app.get("/make-server-356393ac/sessions/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const session = await kv.get(`session:${sessionId}`);

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ success: true, session });
  } catch (error) {
    console.error("❌ Error fetching session:", error);
    return c.json({ error: `Failed to fetch session: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Update session status
app.put("/make-server-356393ac/sessions/:sessionId/status", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const { status } = await c.req.json();

    if (!status || !["active", "completed", "cancelled"].includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    session.status = status;
    session.updatedAt = new Date().toISOString();
    await kv.set(`session:${sessionId}`, session);

    console.log(`✅ Session ${sessionId} status updated to: ${status}`);
    return c.json({ success: true, session });
  } catch (error) {
    console.error("❌ Error updating session:", error);
    return c.json({ error: `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// ========================================
// Payment Management
// ========================================

// Record a payment
app.post("/make-server-356393ac/payments", async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, amount, method, printCount } = body;

    if (!sessionId || !amount || !method || !printCount) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const payment = {
      id: paymentId,
      sessionId,
      amount,
      method, // 'card' or 'cash'
      printCount,
      status: "completed",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`payment:${paymentId}`, payment);
    console.log(`✅ Payment recorded: ${paymentId}, Amount: ${amount}`);

    return c.json({ success: true, paymentId, payment });
  } catch (error) {
    console.error("❌ Error recording payment:", error);
    return c.json({ error: `Failed to record payment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Get payment by ID
app.get("/make-server-356393ac/payments/:paymentId", async (c) => {
  try {
    const paymentId = c.req.param("paymentId");
    const payment = await kv.get(`payment:${paymentId}`);

    if (!payment) {
      return c.json({ error: "Payment not found" }, 404);
    }

    return c.json({ success: true, payment });
  } catch (error) {
    console.error("❌ Error fetching payment:", error);
    return c.json({ error: `Failed to fetch payment: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// ========================================
// Statistics & Analytics
// ========================================

// Get daily statistics
app.get("/make-server-356393ac/stats/daily", async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats:daily:${today}`;
    
    let stats = await kv.get(statsKey);
    if (!stats) {
      stats = {
        date: today,
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        totalRevenue: 0,
        photosCaptured: 0,
        printsByCount: {},
        paymentMethods: { card: 0, cash: 0 },
      };
    }

    return c.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    return c.json({ error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Update daily statistics (internal use)
app.post("/make-server-356393ac/stats/update", async (c) => {
  try {
    const body = await c.req.json();
    const { type, data } = body; // type: 'session', 'payment', 'photos'

    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats:daily:${today}`;
    
    let stats = await kv.get(statsKey);
    if (!stats) {
      stats = {
        date: today,
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        totalRevenue: 0,
        photosCaptured: 0,
        printsByCount: {},
        paymentMethods: { card: 0, cash: 0 },
      };
    }

    if (type === 'session') {
      stats.totalSessions += 1;
      if (data.status === 'completed') stats.completedSessions += 1;
      if (data.status === 'cancelled') stats.cancelledSessions += 1;
    } else if (type === 'payment') {
      stats.totalRevenue += data.amount;
      stats.paymentMethods[data.method] = (stats.paymentMethods[data.method] || 0) + 1;
      stats.printsByCount[data.printCount] = (stats.printsByCount[data.printCount] || 0) + 1;
    } else if (type === 'photos') {
      stats.photosCaptured += data.count;
    }

    await kv.set(statsKey, stats);
    console.log(`✅ Stats updated for ${today}`);

    return c.json({ success: true, stats });
  } catch (error) {
    console.error("❌ Error updating stats:", error);
    return c.json({ error: `Failed to update stats: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Get all-time statistics
app.get("/make-server-356393ac/stats/all-time", async (c) => {
  try {
    const allStats = await kv.getByPrefix("stats:daily:");
    
    const aggregated = {
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      totalRevenue: 0,
      photosCaptured: 0,
      printsByCount: {},
      paymentMethods: { card: 0, cash: 0 },
      dayCount: allStats.length,
    };

    allStats.forEach((stat: any) => {
      aggregated.totalSessions += stat.totalSessions || 0;
      aggregated.completedSessions += stat.completedSessions || 0;
      aggregated.cancelledSessions += stat.cancelledSessions || 0;
      aggregated.totalRevenue += stat.totalRevenue || 0;
      aggregated.photosCaptured += stat.photosCaptured || 0;
      
      Object.entries(stat.printsByCount || {}).forEach(([count, value]) => {
        aggregated.printsByCount[count] = (aggregated.printsByCount[count] || 0) + (value as number);
      });
      
      aggregated.paymentMethods.card += stat.paymentMethods?.card || 0;
      aggregated.paymentMethods.cash += stat.paymentMethods?.cash || 0;
    });

    return c.json({ success: true, stats: aggregated });
  } catch (error) {
    console.error("❌ Error fetching all-time stats:", error);
    return c.json({ error: `Failed to fetch all-time stats: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// ========================================
// Image Storage & Sharing
// ========================================

const BUCKET_NAME = "make-356393ac-photobooth-images";
const FRAMES_BUCKET_NAME = "make-356393ac-frames";

// Initialize storage buckets
const initializeStorageBuckets = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Initialize photobooth images bucket
    const imagesBucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    if (!imagesBucketExists) {
      console.log(`📦 Creating storage bucket: ${BUCKET_NAME}`);
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Make bucket public for easy sharing
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
      });
      
      if (error) {
        // Ignore 409 conflict errors (bucket already exists)
        if (error.statusCode === '409') {
          console.log(`✅ Storage bucket ${BUCKET_NAME} already exists (409)`);
        } else {
          console.error("❌ Error creating images bucket:", error);
        }
      } else {
        console.log("✅ Images storage bucket created successfully");
      }
    } else {
      console.log(`✅ Storage bucket ${BUCKET_NAME} already exists`);
    }
    
    // Initialize frames bucket
    const framesBucketExists = buckets?.some(bucket => bucket.name === FRAMES_BUCKET_NAME);
    if (!framesBucketExists) {
      console.log(`📦 Creating frames bucket: ${FRAMES_BUCKET_NAME}`);
      const { error } = await supabase.storage.createBucket(FRAMES_BUCKET_NAME, {
        public: true, // Make bucket public for easy access
        fileSizeLimit: 5242880, // 5MB per frame
        allowedMimeTypes: ['image/png']
      });
      
      if (error) {
        // Ignore 409 conflict errors (bucket already exists)
        if (error.statusCode === '409') {
          console.log(`✅ Frames bucket ${FRAMES_BUCKET_NAME} already exists (409)`);
        } else {
          console.error("❌ Error creating frames bucket:", error);
        }
      } else {
        console.log("✅ Frames storage bucket created successfully");
      }
    } else {
      console.log(`✅ Frames bucket ${FRAMES_BUCKET_NAME} already exists`);
    }
  } catch (error) {
    console.error("❌ Error initializing storage buckets:", error);
  }
};

// Initialize on server start
initializeStorageBuckets();

// Upload image to storage
app.post("/make-server-356393ac/images/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { dataUrl, templateName, imageId: preGeneratedId } = body;

    if (!dataUrl || !templateName) {
      return c.json({ error: "Missing required fields: dataUrl, templateName" }, 400);
    }

    // Validate dataUrl format
    if (!dataUrl.startsWith('data:image/')) {
      console.error("❌ Invalid dataUrl format:", dataUrl.substring(0, 100));
      return c.json({ error: "Invalid image data format" }, 400);
    }

    // Use pre-generated ID if provided, otherwise generate new one
    const imageId = preGeneratedId || `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    console.log(`🆔 Image ID: ${imageId}${preGeneratedId ? ' (pre-generated)' : ' (new)'}`);
    const fileName = `${imageId}.png`;

    // Convert base64 to blob
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      console.error("❌ Failed to extract base64 data from dataUrl");
      return c.json({ error: "Invalid base64 data" }, 400);
    }

    // Clean base64 string (remove whitespace and newlines)
    const cleanBase64 = base64Data.replace(/\s/g, '');
    
    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
    } catch (decodeError) {
      console.error("❌ Base64 decode error:", decodeError);
      return c.json({ error: "Failed to decode base64 data" }, 400);
    }

    console.log(`📤 Uploading image: ${fileName}, size: ${binaryData.length} bytes`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, binaryData, {
        contentType: 'image/png',
        cacheControl: '31536000', // 1 year
        upsert: false
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return c.json({ error: `Failed to upload image: ${error.message}` }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Store metadata in KV store
    const metadata = {
      id: imageId,
      fileName,
      templateName,
      publicUrl,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    await kv.set(`image:${imageId}`, metadata);
    
    console.log(`✅ Image uploaded successfully: ${imageId}`);
    console.log(`🔗 Public URL: ${publicUrl}`);

    return c.json({ 
      success: true, 
      imageId,
      publicUrl,
      metadata
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    return c.json({ 
      error: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Get image metadata by ID
app.get("/make-server-356393ac/images/:imageId", async (c) => {
  try {
    const imageId = c.req.param("imageId");
    console.log(`🔍 Fetching image metadata: ${imageId}`);
    
    const metadata = await kv.get(`image:${imageId}`);

    if (!metadata) {
      console.log(`❌ Image not found: ${imageId}`);
      return c.json({ error: "Image not found" }, 404);
    }

    // Check if expired
    const expiresAt = new Date(metadata.expiresAt);
    if (expiresAt < new Date()) {
      console.log(`⏰ Image expired: ${imageId}`);
      return c.json({ error: "Image has expired" }, 410);
    }

    console.log(`✅ Image metadata found: ${imageId}`);
    return c.json({ success: true, metadata });
  } catch (error) {
    console.error("❌ Error fetching image:", error);
    return c.json({ 
      error: `Failed to fetch image: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// Delete old images (cleanup job)
app.post("/make-server-356393ac/images/cleanup", async (c) => {
  try {
    console.log("🧹 Starting image cleanup...");
    
    const allImages = await kv.getByPrefix("image:");
    const now = new Date();
    let deletedCount = 0;

    for (const image of allImages) {
      const expiresAt = new Date(image.expiresAt);
      if (expiresAt < now) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([image.fileName]);

        if (storageError) {
          console.error(`❌ Failed to delete file ${image.fileName}:`, storageError);
        }

        // Delete metadata from KV
        await kv.del(`image:${image.id}`);
        deletedCount++;
        console.log(`🗑️ Deleted expired image: ${image.id}`);
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} images`);
    return c.json({ success: true, deletedCount });
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    return c.json({ 
      error: `Failed to cleanup images: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, 500);
  }
});

// ========================================
// System Settings
// ========================================

// Get system settings
app.get("/make-server-356393ac/settings", async (c) => {
  try {
    let settings = await kv.get("system:settings");
    
    if (!settings) {
      // Default settings
      settings = {
        language: "ko",
        currency: "KRW",
        basePrice: 5000,
        timezone: "Asia/Seoul",
        maintenanceMode: false,
      };
      await kv.set("system:settings", settings);
    }

    return c.json({ success: true, settings });
  } catch (error) {
    console.error("❌ Error fetching settings:", error);
    return c.json({ error: `Failed to fetch settings: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Update system settings
app.put("/make-server-356393ac/settings", async (c) => {
  try {
    const body = await c.req.json();
    const currentSettings = await kv.get("system:settings") || {};
    
    const updatedSettings = {
      ...currentSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await kv.set("system:settings", updatedSettings);
    console.log("✅ System settings updated");

    return c.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("❌ Error updating settings:", error);
    return c.json({ error: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// ========================================
// Frame Management
// ========================================

// Upload frame image to Storage
app.post("/make-server-356393ac/frames/upload", async (c) => {
  try {
    const body = await c.req.json();
    const { dataUrl, frameId, filename } = body;
    
    if (!dataUrl || !frameId || !filename) {
      return c.json({ error: "Missing required fields: dataUrl, frameId, filename" }, 400);
    }
    
    // Sanitize frameId and filename to be URL-safe (remove non-ASCII characters)
    const sanitizedFrameId = frameId.replace(/[^\x00-\x7F]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-');
    const sanitizedFilename = filename.replace(/[^\x00-\x7F]/g, '').replace(/[^a-zA-Z0-9-_.]/g, '-');
    
    // Convert base64 to buffer
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      return c.json({ error: "Invalid dataUrl format" }, 400);
    }
    
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Storage
    const filePath = `${sanitizedFrameId}/${sanitizedFilename}`;
    const { data, error } = await supabase.storage
      .from(FRAMES_BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error("❌ Storage upload error:", error);
      return c.json({ error: `Failed to upload to storage: ${error.message}` }, 500);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(FRAMES_BUCKET_NAME)
      .getPublicUrl(filePath);
    
    console.log(`✅ Frame image uploaded: ${filePath}`);
    return c.json({ success: true, publicUrl, path: filePath });
  } catch (error) {
    console.error("❌ Error uploading frame image:", error);
    return c.json({ error: `Failed to upload frame image: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Get all frames (metadata only)
app.get("/make-server-356393ac/frames", async (c) => {
  try {
    const frames = await kv.get("admin:frames") || [];
    return c.json({ success: true, frames });
  } catch (error) {
    console.error("❌ Error fetching frames:", error);
    return c.json({ error: `Failed to fetch frames: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Save/update frame metadata
app.post("/make-server-356393ac/frames", async (c) => {
  try {
    const body = await c.req.json();
    const { frame } = body;
    
    if (!frame || !frame.id) {
      return c.json({ error: "Invalid frame data" }, 400);
    }
    
    const frames = await kv.get("admin:frames") || [];
    const existingIndex = frames.findIndex(
      (f: any) => f.id === frame.id
    );
    
    if (existingIndex >= 0) {
      frames[existingIndex] = frame;
    } else {
      frames.push(frame);
    }
    
    await kv.set("admin:frames", frames);
    console.log(`✅ Frame metadata saved: ${frame.id}`);
    
    return c.json({ success: true, frames });
  } catch (error) {
    console.error("❌ Error saving frame:", error);
    return c.json({ error: `Failed to save frame: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Delete frame
app.delete("/make-server-356393ac/frames/:frameId", async (c) => {
  try {
    const frameId = c.req.param("frameId");
    const frames = await kv.get("admin:frames") || [];
    const filtered = frames.filter((f: any) => f.id !== frameId);
    
    // Delete from Storage
    try {
      const { data: files } = await supabase.storage
        .from(FRAMES_BUCKET_NAME)
        .list(frameId);
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${frameId}/${file.name}`);
        await supabase.storage.from(FRAMES_BUCKET_NAME).remove(filePaths);
        console.log(`✅ Deleted ${filePaths.length} frame images from storage`);
      }
    } catch (storageError) {
      console.warn("⚠️ Error deleting from storage (non-critical):", storageError);
    }
    
    await kv.set("admin:frames", filtered);
    console.log(`✅ Frame deleted: ${frameId}`);
    
    return c.json({ success: true, frames: filtered });
  } catch (error) {
    console.error("❌ Error deleting frame:", error);
    return c.json({ error: `Failed to delete frame: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Clear all frames
app.delete("/make-server-356393ac/frames", async (c) => {
  try {
    await kv.set("admin:frames", []);
    console.log("✅ All frames cleared");
    
    return c.json({ success: true, frames: [] });
  } catch (error) {
    console.error("❌ Error clearing frames:", error);
    return c.json({ error: `Failed to clear frames: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// ========================================
// Template Settings Management
// ========================================

// Get template settings
app.get("/make-server-356393ac/template-settings", async (c) => {
  try {
    const settings = await kv.get("admin:template_settings") || [];
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("❌ Error fetching template settings:", error);
    return c.json({ error: `Failed to fetch template settings: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

// Save template settings
app.post("/make-server-356393ac/template-settings", async (c) => {
  try {
    const body = await c.req.json();
    const { settings } = body;
    
    if (!settings || !Array.isArray(settings)) {
      return c.json({ error: "Invalid settings data" }, 400);
    }
    
    await kv.set("admin:template_settings", settings);
    console.log(`✅ Template settings saved: ${settings.length} entries`);
    
    return c.json({ success: true, settings });
  } catch (error) {
    console.error("❌ Error saving template settings:", error);
    return c.json({ error: `Failed to save template settings: ${error instanceof Error ? error.message : 'Unknown error'}` }, 500);
  }
});

Deno.serve(app.fetch);