import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("productId") as string;

    if (!file || !productId) {
      return NextResponse.json(
        { error: "File and product ID are required" },
        { status: 400 }
      );
    }

    // Get the token from environment variable
    const token = process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN environment variable is not set");
    }

    // Upload to Vercel Blob Storage
    const fileName = `coa-${productId}-${Date.now()}.pdf`;
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: 'application/pdf',
      token, // Pass the token explicitly
    });

    // Save the COA URL to the database
    await prisma.product.update({
      where: { id: productId },
      data: { coaUrl: blob.url },
    });

    console.log("COA uploaded:", {
      productId,
      fileName: file.name,
      url: blob.url,
    });

    return NextResponse.json({
      message: "COA uploaded successfully",
      fileName: file.name,
      coaUrl: blob.url,
    });
  } catch (error) {
    console.error("Error uploading COA:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload COA" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get the current product to find the COA URL
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { coaUrl: true },
    });

    if (!product || !product.coaUrl) {
      return NextResponse.json(
        { error: "No COA found for this product" },
        { status: 404 }
      );
    }

    // Get the token from environment variable
    const token = process.env.BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN environment variable is not set");
    }

    // Delete the blob from Vercel Blob Storage
    try {
      await del(product.coaUrl, { token });
    } catch (blobError) {
      console.error("Error deleting blob:", blobError);
      // Continue to remove the URL from the database even if blob deletion fails
    }

    // Remove the COA URL from the database
    await prisma.product.update({
      where: { id: productId },
      data: { coaUrl: null },
    });

    console.log("COA deleted:", {
      productId,
      url: product.coaUrl,
    });

    return NextResponse.json({
      message: "COA deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting COA:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete COA" },
      { status: 500 }
    );
  }
}
