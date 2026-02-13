import { NextResponse } from "next/server";
import { createCustomer, createCustomerWithLogin } from "@/lib/green";

/**
 * Create a customer in Green system
 * POST /api/green/create-customer
 */
export async function POST(req: Request) {
  try {
    const {
      customerData,
      withLogin,
    } = await req.json();

    if (!customerData || !customerData.NameFirst || !customerData.NameLast) {
      return NextResponse.json(
        { error: "NameFirst and NameLast are required" },
        { status: 400 }
      );
    }

    let result;
    if (withLogin && customerData.UserName && customerData.Password) {
      result = await createCustomerWithLogin(customerData);
    } else {
      result = await createCustomer(customerData);
    }

    if (!result.Payor_ID) {
      return NextResponse.json(
        { error: result.ResultDescription || "Failed to create customer" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payorId: result.Payor_ID,
      result: result.Result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Sorry, something went wrong. please contact support or try again later" },
      { status: 500 }
    );
  }
}

