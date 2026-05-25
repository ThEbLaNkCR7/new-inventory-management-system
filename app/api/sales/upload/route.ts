import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export const POST = async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get("bill") as File;

    // Check file exists
    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 },
      );
    }

    // Optional: validate image type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Optional: validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadedUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "bills",
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary Error:", error);
            return reject(error);
          }

          if (!result?.secure_url) {
            return reject(new Error("Upload failed"));
          }

          resolve(result.secure_url);
        },
      );

      stream.end(buffer);
    });

    // Success response
    return NextResponse.json(
      {
        url: uploadedUrl,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Upload Error:", error);

    return NextResponse.json(
      {
        message: error?.message || "Upload failed",
      },
      { status: 500 },
    );
  }
};
