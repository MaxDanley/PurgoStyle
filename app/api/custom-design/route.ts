import { NextResponse } from "next/server";
import { sendCustomDesignInquiryEmails, type CustomDesignInquiryData } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      brand,
      whatDoYouSell,
      designServices,
      projectDetails,
      timeline,
      quantityEstimate,
    } = body;

    if (!name?.trim() || !email?.trim() || !brand?.trim() || !whatDoYouSell?.trim() || !designServices?.trim() || !projectDetails?.trim() || !timeline?.trim()) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const data: CustomDesignInquiryData = {
      name: String(name).trim(),
      email: String(email).trim(),
      brand: String(brand).trim(),
      whatDoYouSell: String(whatDoYouSell).trim(),
      designServices: String(designServices).trim(),
      projectDetails: String(projectDetails).trim(),
      timeline: String(timeline).trim(),
    };
    if (phone?.trim()) data.phone = String(phone).trim();
    if (quantityEstimate?.trim()) data.quantityEstimate = String(quantityEstimate).trim();

    await sendCustomDesignInquiryEmails(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Custom design inquiry error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email us at help@summersteez.com." },
      { status: 500 }
    );
  }
}
