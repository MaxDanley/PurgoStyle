import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

// Initialize Resend
if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY environment variable is not set");
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.EMAIL_FROM || "noreply@purgostyle.com";

async function sendTestEmail() {
  try {
    // Read the HTML template
    const htmlPath = path.join(process.cwd(), "www.purgostyle.com", "email.html");
    let htmlContent = fs.readFileSync(htmlPath, "utf-8");

    // Read all images and convert to base64
    const imagesDir = path.join(process.cwd(), "www.purgostyle.com", "images");
    const imageFiles = [
      "0f9b650b2c6a91c21d2b25b93ed89a4e.png",
      "38a22cf9aa0054a0c9afa35e014a58bc.png",
      "91689050cca04e7181665dd4ac683e20.png",
      "45ab1ddd80e853814a876d0e632a60fe.png",
    ];

    // Replace image paths with base64 data URIs
    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesDir, imageFile);
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");
        const dataUri = `data:image/png;base64,${base64Image}`;
        
        // Replace relative paths with data URIs (handle both quoted and unquoted)
        const relativePath = `images/${imageFile}`;
        // Escape special regex characters
        const escapedPath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Replace all occurrences
        htmlContent = htmlContent.replace(new RegExp(escapedPath, "g"), dataUri);
        
        console.log(`✓ Embedded image: ${imageFile}`);
      } else {
        console.warn(`⚠ Image not found: ${imagePath}`);
      }
    }

    // Send the email
    console.log("\n📧 Sending test email to hello@purgostyle.com...");
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: "hello@purgostyle.com",
      subject: "Test Email - Purgo Style Labs Template",
      html: htmlContent,
    });

    console.log("\n✅ Email sent successfully!");
    console.log("Email ID:", result.data?.id);
  } catch (error: any) {
    console.error("\n❌ Failed to send email:", error);
    if (error.message) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

sendTestEmail();

