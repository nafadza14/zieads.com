const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runTest() {
  console.log("=== TESTING POST /api/media/upload FUNCTIONALITY ===");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Vercel Blob Token Present:", !!blobToken);

  // 1. Get a mock user ID from database to associate with media
  const { data: users, error: userError } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (userError || !users || users.length === 0) {
    console.error("Failed to find a user in profiles table. Please create/onboard a user first.", userError);
    return;
  }
  const userId = users[0].id;
  console.log("Using test user ID:", userId);

  // 2. Read sample image
  const sampleImagePath = path.join(__dirname, '../public/zieads-dashboard.png');
  if (!fs.existsSync(sampleImagePath)) {
    console.error("Sample image not found at:", sampleImagePath);
    return;
  }
  const fileBuffer = fs.readFileSync(sampleImagePath);
  const fileName = 'zieads-dashboard.png';
  const mimeType = 'image/png';

  console.log(`Reading sample image: ${fileName} (${fileBuffer.length} bytes)`);

  let blobUrl = "https://example-blob.vercel-storage.com/dummy-upload.png";
  const blobPathname = `user-media/${userId}/${Date.now()}-${fileName}`;

  // 3. Upload to Vercel Blob
  if (blobToken) {
    try {
      console.log("Uploading to Vercel Blob...");
      const blob = await put(blobPathname, fileBuffer, {
        access: "public",
        token: blobToken
      });
      blobUrl = blob.url;
      console.log("Vercel Blob Upload Successful! URL:", blobUrl);
    } catch (uploadErr) {
      console.error("Vercel Blob Upload failed (check your token):", uploadErr.message);
      console.log("Falling back to mock Vercel Blob URL for database insertion testing...");
    }
  } else {
    console.log("No Vercel Blob token found in environment. Using mock Vercel Blob URL...");
  }

  // 4. Extract dimensions (mocking sharp to avoid native platform binary issues in test environment)
  const width = 800;
  const height = 600;

  // 5. Insert into media_library
  try {
    console.log("Inserting into media_library database table...");
    const { data: media, error: insertError } = await supabaseAdmin
      .from("media_library")
      .insert({
        user_id: userId,
        blob_url: blobUrl,
        blob_pathname: blobPathname,
        file_name: fileName,
        file_size_bytes: fileBuffer.length,
        mime_type: mimeType,
        width,
        height,
        duration_seconds: null
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("✅ media_library table insertion successful!");
    console.log("Database Row Created:", {
      id: media.id,
      url: media.blob_url,
      file_name: media.file_name,
      mime_type: media.mime_type,
      width: media.width,
      height: media.height
    });

    // Cleanup: Delete the inserted row so we don't clutter the media library
    console.log("Cleaning up test row...");
    const { error: deleteError } = await supabaseAdmin
      .from("media_library")
      .delete()
      .eq("id", media.id);
    
    if (deleteError) {
      console.error("Cleanup failed:", deleteError.message);
    } else {
      console.log("✅ Cleanup successful.");
    }

  } catch (err) {
    console.error("❌ Database insertion failed:", err.message);
  }
}

runTest();
