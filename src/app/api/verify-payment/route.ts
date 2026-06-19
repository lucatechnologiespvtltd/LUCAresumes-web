import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function getCredentials() {
  let keyId = process.env.RAZORPAY_KEY_ID;
  let keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    try {
      // Backup: Read .env directly from filesystem (helps if server wasn't restarted)
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const lines = envContent.split("\n");
        for (const line of lines) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || "";
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            if (key === "RAZORPAY_KEY_ID") keyId = value.trim();
            if (key === "RAZORPAY_KEY_SECRET") keySecret = value.trim();
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read .env file from disk:", e);
    }
  }

  return { keyId, keySecret };
}

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required signature verification fields." },
        { status: 400 }
      );
    }

    const { keySecret } = getCredentials();
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server. Please check your .env file." },
        { status: 500 }
      );
    }

    // Generate expected signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json(
        { error: "Signature verification failed. Invalid payment proof." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return NextResponse.json(
      { error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}
