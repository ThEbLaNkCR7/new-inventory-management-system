import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export const POST = async (req: NextRequest) => {
  try {
    console.log("========== UPLOAD START ==========");

    // ENV DEBUG
    console.log("ENV CHECK:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      has_secret: !!process.env.CLOUDINARY_API_SECRET,
    });

    const formData = await req.formData();

    console.log("FormData received");

    const file = formData.get("bill") as File;

    console.log("FILE:", {
      exists: !!file,
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    // Check file exists
    if (!file) {
      console.log("❌ No file uploaded");

      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 },
      );
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      console.log("❌ Invalid file type:", file.type);

      return NextResponse.json(
        { message: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      console.log("❌ File too large:", file.size);

      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    console.log("✅ Validation passed");

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();

    console.log("ArrayBuffer created:", arrayBuffer.byteLength);

    const buffer = Buffer.from(arrayBuffer);

    console.log("Buffer created:", buffer.length);

    console.log("🚀 Starting Cloudinary upload...");

    // Upload to Cloudinary
    const uploadedUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bills",
        },
        (error, result) => {
          console.log("📥 Cloudinary callback triggered");

          if (error) {
            console.error("❌ Cloudinary Error FULL:", error);
            console.error("❌ Cloudinary Error MESSAGE:", error?.message);
            console.error("❌ Cloudinary Error HTTP:", error?.http_code);

            return reject(error);
          }

          console.log("✅ Cloudinary upload success:", result);

          if (!result?.secure_url) {
            console.log("❌ No secure_url returned");

            return reject(new Error("Upload failed"));
          }

          resolve(result.secure_url);
        },
      );

      console.log("📤 Sending buffer to stream");

      stream.end(buffer);
    });

    console.log("✅ FINAL URL:", uploadedUrl);

    console.log("========== UPLOAD SUCCESS ==========");

    return NextResponse.json(
      {
        url: uploadedUrl,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("========== UPLOAD FAILED ==========");
    console.error("❌ Upload Error FULL:", error);
    console.error("❌ Upload Error MESSAGE:", error?.message);
    console.error("❌ Upload Error STACK:", error?.stack);

    return NextResponse.json(
      {
        message: error?.message || "Upload failed",
      },
      { status: 500 },
    );
  }
};
