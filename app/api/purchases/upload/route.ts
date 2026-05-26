import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export const POST = async (req: NextRequest) => {
  try {
    console.log("========== PURCHASE BILL UPLOAD START ==========");

    const formData = await req.formData();

    const file = formData.get("purchaseBill") as File;

    console.log("PURCHASE BILL:", {
      exists: !!file,
      name: file?.name,
      type: file?.type,
      size: file?.size,
    });

    // Check file exists
    if (!file) {
      return NextResponse.json(
        { message: "No purchase bill uploaded" },
        { status: 400 },
      );
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    console.log("✅ Purchase bill validation passed");

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("🚀 Starting Cloudinary upload...");

    // Upload to Cloudinary
    const uploadedUrl: string = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "purchase-bills",
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary Error:", error);

            return reject(error);
          }

          if (!result?.secure_url) {
            return reject(new Error("Upload failed"));
          }

          console.log("✅ Purchase bill uploaded:", result.secure_url);

          resolve(result.secure_url);
        },
      );

      stream.end(buffer);
    });

    console.log("========== PURCHASE BILL UPLOAD SUCCESS ==========");

    return NextResponse.json(
      {
        url: uploadedUrl,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("========== PURCHASE BILL UPLOAD FAILED ==========");
    console.error("❌ Error:", error);

    return NextResponse.json(
      {
        message: error?.message || "Purchase bill upload failed",
      },
      { status: 500 },
    );
  }
};
