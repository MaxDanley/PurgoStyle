import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST(req: Request) {
  console.log('🔔 Test webhook call received!');
  
  try {
    const body = await req.text();
    console.log('📝 Test webhook body:', body);
    
    return NextResponse.json({ 
      message: "Test webhook received successfully",
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json(
      { error: "Test webhook failed" },
      { status: 500 }
    );
  }
}
