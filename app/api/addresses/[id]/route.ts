import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name, street, city, state, zipCode, country, phone } = await req.json();
    const { id } = await params;

    const address = await prisma.address.update({
      where: { 
        id,
        userId: session.user.id // Ensure user can only update their own addresses
      },
      data: {
        name,
        street,
        city,
        state,
        zipCode,
        country: country || "US",
        phone,
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Allow deletion regardless of order usage - orders keep their own copy of address data
    await prisma.address.delete({
      where: { 
        id,
        userId: session.user.id // Ensure user can only delete their own addresses
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    
    // Handle foreign key constraint error by updating orders to null first
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      try {
        const { id } = await params;
        const session = await auth();
        
        if (!session?.user?.id) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        
        // Update all orders using this address to have null shippingAddressId
        await prisma.order.updateMany({
          where: {
            shippingAddressId: id,
            userId: session.user.id,
          },
          data: {
            shippingAddressId: null,
          },
        });
        
        // Now try deleting the address again
        await prisma.address.delete({
          where: { 
            id,
            userId: session.user.id
          },
        });
        
        return NextResponse.json({ success: true });
      } catch (retryError) {
        console.error("Error on retry delete:", retryError);
        return NextResponse.json(
          { error: "Failed to delete address" },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
