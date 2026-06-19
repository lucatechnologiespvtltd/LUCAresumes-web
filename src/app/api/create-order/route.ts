import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
// @ts-ignore
import Razorpay from "razorpay";

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
    const { amount, currency = "INR", receipt } = await request.json();

    // Validate amount >= 100 paise
    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = getCredentials();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server. Please check your .env file." },
        { status: 500 }
      );
    }

    // ESM / CommonJS constructor resolution fallback
    const RazorpayConstructor = (Razorpay as any).default || Razorpay;
    const razorpay = new RazorpayConstructor({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount), // must be integer paise
      currency,
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error details:", error);
    
    // Extract detailed error message from Razorpay API response objects
    const errorMessage = 
      error.description || 
      error.message || 
      (error.error && error.error.description) || 
      "Failed to create order";

    return NextResponse.json(
      { 
        error: errorMessage,
        details: typeof error === "object" ? error : String(error)
      },
      { status: 500 }
    );
  }
}
