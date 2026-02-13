import { NextResponse } from "next/server";
import { 
  createCustomerWithLogin, 
  getCustomerInformation,
  getPlaidIframeUrl 
} from "@/lib/green";

/**
 * Setup customer in Green system and get Plaid iframe URL
 * This does NOT create an order - order is created after bank verification
 * POST /api/green/setup-customer
 */
export async function POST(req: Request) {
  try {
    const {
      billingInfo,
      shippingInfo,
      userEmail,
      payorId, // Optional: if customer already exists
    } = await req.json();

    // If payorId provided, verify customer exists and return Plaid URL
    if (payorId && typeof payorId === 'string' && payorId.trim() !== '') {
      try {
        const customerInfo = await getCustomerInformation(payorId);
        const plaidIframeUrl = getPlaidIframeUrl(payorId);
        
        return NextResponse.json({
          success: true,
          payorId,
          plaidIframeUrl,
          hasBankAccount: !!(customerInfo.RoutingNumber && customerInfo.AccountNumber),
          customer: customerInfo,
        });
      } catch (error: any) {
        // Fall through to create new customer
      }
    }

    // Create new customer in Green system
    // Extract name parts safely
    const billingName = billingInfo?.name || '';
    const shippingName = shippingInfo?.name || '';
    const firstName = billingName.split(' ')[0] || shippingName.split(' ')[0] || '';
    const lastName = billingName.split(' ').slice(1).join(' ') || shippingName.split(' ').slice(1).join(' ') || billingName.split(' ')[0] || shippingName.split(' ')[0] || '';
    
    // Validate required fields
    if (!firstName || !lastName) {
      throw new Error("NameFirst and NameLast are required");
    }

    // For Plaid integration, we only need minimal customer + billing info
    // The actual bank routing/account numbers will be added via Plaid iframe
    const email = (userEmail || shippingInfo?.email)?.trim();
    const phone = (billingInfo?.phone || shippingInfo?.phone)?.trim();
    const addressSource = billingInfo?.street ? billingInfo : shippingInfo;
    const street = addressSource?.street || "";
    const city = addressSource?.city || "";
    const state = addressSource?.state || "";
    const zipCode = addressSource?.zipCode || "";
    const country = addressSource?.country || "US";
    
    // Generate username and password for CreateCustomerWithLogin
    // Username: use email prefix (before @) or generate from name + timestamp
    const usernameBase = email 
      ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      : `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-zA-Z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    const userName = `${usernameBase}${timestamp}`;
    
    // Generate a secure password (12 characters: alphanumeric + special)
    const passwordChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const password = Array.from({ length: 12 }, () => 
      passwordChars.charAt(Math.floor(Math.random() * passwordChars.length))
    ).join('');
    
    // Use CreateCustomerWithLogin
    // Green's API requires bank address fields to be supplied to get the Plaid link
    // These are placeholders - Plaid will update with actual bank account info
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const customerData: any = {
      NameFirst: firstName.trim(),
      NameLast: lastName.trim(),
      NickName: fullName,                // Required in practice
      BankAccountCompanyName: fullName,  // Required to get Plaid link
      BankAccountAddress1: street,
      BankAccountCity: city,
      BankAccountState: state,
      BankAccountZip: zipCode,
      BankAccountCountry: country,
      UserName: userName,
      Password: password,
    };

    // Only include truly optional contact fields if they have non-empty values
    if (email) {
      customerData.EmailAddress = email;
    }
    
    if (phone) {
      customerData.PhoneWork = phone;
    }
    
    // Note: We send bank address fields as placeholders to get Plaid link.
    // Plaid will update these with actual bank account information.

    const createResult = await createCustomerWithLogin(customerData);
    const newPayorId = createResult.Payor_ID;
    
    if (!newPayorId || typeof newPayorId !== 'string' || newPayorId.trim() === '' || newPayorId === 'string') {
      throw new Error("Failed to create customer in Green system - invalid Payor_ID received");
    }
    
    const plaidIframeUrl = getPlaidIframeUrl(newPayorId);

    const responseData = {
      success: true,
      payorId: newPayorId,
      plaidIframeUrl,
      hasBankAccount: false,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    // Log the actual error for debugging
    console.error('[Green Setup Customer] Error:', error?.message || error);
    console.error('[Green Setup Customer] Stack:', error?.stack);
    
    return NextResponse.json(
      { error: "Sorry, something went wrong. please contact support or try again later" },
      { status: 500 }
    );
  }
}

