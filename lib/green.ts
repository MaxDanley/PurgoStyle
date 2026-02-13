/**
 * Green by Phone API Integration (SOAP)
 * Documentation: https://greenbyphone.com/plaid/api/
 * 
 * This library handles SOAP API calls to Green by Phone for eDebit/ACH payments
 * using Plaid bank login integration.
 */

// SOAP endpoint URL from Green API documentation
const GREEN_API_URL = process.env.GREEN_API_URL || "https://greenbyphone.com/eCheck.asmx";
// MID (Merchant ID) is the same as Client_ID - use your MID from the Green dashboard
const GREEN_CLIENT_ID = process.env.GREEN_CLIENT_ID || process.env.GREEN_MID || "";
const GREEN_API_PASSWORD = process.env.GREEN_API_PASSWORD || "";

export interface GreenCustomer {
  Payor_ID: string;
  NickName?: string;
  NameFirst: string;
  NameLast: string;
  PhoneWork?: string;
  EmailAddress?: string;
  RoutingNumber?: string;
  AccountNumber?: string;
  BankAccountCompanyName?: string;
}

export interface CreateCustomerRequest {
  NameFirst: string;
  NameLast: string;
  NickName?: string;
  PhoneWork?: string;
  EmailAddress?: string;
  BankAccountCompanyName?: string;
  BankAccountAddress1?: string;
  BankAccountAddress2?: string;
  BankAccountCity?: string;
  BankAccountState?: string;
  BankAccountZip?: string;
  BankAccountCountry?: string;
  RoutingNumber?: string;
  AccountNumber?: string;
  Note?: string;
  UserName?: string; // Required for CreateCustomerWithLogin
  Password?: string; // Required for CreateCustomerWithLogin
}

export interface CreateCustomerResponse {
  Payor_ID: string;
  Result: string;
  ResultDescription?: string;
}

export interface GetCustomerInformationResponse {
  Payor_ID: string;
  NickName?: string;
  NameFirst: string;
  NameLast: string;
  PhoneWork?: string;
  EmailAddress?: string;
  RoutingNumber?: string; // Obfuscated
  AccountNumber?: string; // Obfuscated
  BankAccountCompanyName?: string;
  Result: string;
  ResultDescription?: string;
}

export interface CustomerOneTimeDraftRequest {
  Payor_ID: string;
  CheckAmount: number | string;
  CheckDate: string; // Format: YYYY-MM-DD
  CheckMemo?: string;
}

export interface CustomerOneTimeDraftResponse {
  Result: string | number;
  ResultDescription?: string;
  VerifyResult?: string | number;
  VerifyResultDescription?: string;
  Transaction_ID?: string;
  Check_ID?: string;
  CheckNumber?: string;
}

/**
 * Build SOAP XML envelope for Green API calls
 * Uses tns: namespace prefix and includes all optional fields (even empty) to prevent null reference errors
 */
function buildSOAPEnvelope(action: string, params: Record<string, any>, clientId: string, apiPassword: string): string {
  // Map of field names to their exact XML tag format as per Green API docs
  const fieldNameMap: Record<string, string> = {
    Client_ID: 'Client_ID',
    ApiPassword: 'ApiPassword',
    Payor_ID: 'Payor_ID',
    NameFirst: 'NameFirst',
    NameLast: 'NameLast',
    NickName: 'NickName',
    PhoneWork: 'PhoneWork',
    PhoneWorkExtension: 'PhoneWorkExtension',
    EmailAddress: 'EmailAddress',
    MerchantAccountNumber: 'MerchantAccountNumber',
    BankAccountCompanyName: 'BankAccountCompanyName',
    BankAccountAddress1: 'BankAccountAddress1',
    BankAccountAddress2: 'BankAccountAddress2',
    BankAccountCity: 'BankAccountCity',
    BankAccountState: 'BankAccountState',
    BankAccountZip: 'BankAccountZip',
    BankAccountCountry: 'BankAccountCountry',
    BankName: 'BankName',
    RoutingNumber: 'RoutingNumber',
    AccountNumber: 'AccountNumber',
    Note: 'Note',
    UserName: 'UserName',
    Password: 'Password',
    CheckAmount: 'CheckAmount',
    CheckDate: 'CheckDate',
    CheckMemo: 'CheckMemo',
    x_delim_data: 'x_delim_data',
    x_delim_char: 'x_delim_char',
  };

  // For CreateCustomerWithLogin, we need to include ALL optional fields as empty elements
  // The server-side code has null reference issues if fields are missing
  // Order matches the working curl example
  const createCustomerWithLoginFieldOrder = [
    'NickName',              // Optional - include as empty if not provided
    'NameFirst',             // Required
    'NameLast',              // Required
    'PhoneWork',             // Optional - include as empty if not provided
    'PhoneWorkExtension',   // Optional - include as empty if not provided
    'EmailAddress',          // Optional - include as empty if not provided
    'MerchantAccountNumber', // Optional - include as empty if not provided
    'BankAccountCompanyName', // Optional - include as empty if not provided
    'BankAccountAddress1',   // Optional - include as empty if not provided
    'BankAccountAddress2',   // Optional - include as empty if not provided
    'BankAccountCity',       // Optional - include as empty if not provided
    'BankAccountState',      // Optional - include as empty if not provided
    'BankAccountZip',        // Optional - include as empty if not provided
    'BankAccountCountry',   // Optional - include as empty if not provided
    'BankName',              // Optional - include as empty if not provided
    'RoutingNumber',         // Optional - include as empty if not provided
    'AccountNumber',         // Optional - include as empty if not provided
    'Note',                  // Optional - include as empty if not provided
    'UserName',              // Required
    'Password',              // Required
    'x_delim_data',         // Optional - include as empty if not provided
    'x_delim_char',         // Optional - include as empty if not provided
  ];

  // For CreateCustomerWithLogin, build XML with all fields (empty if not provided)
  // This prevents server-side null reference exceptions
  if (action === 'CreateCustomerWithLogin') {
    const fieldsXml: string[] = [];
    
    // Process all fields in order, including empty ones
    for (const field of createCustomerWithLoginFieldOrder) {
      const xmlKey = fieldNameMap[field] || field;
      const paramValue = params[field] || params[xmlKey];
      
      // Include field with value if provided, otherwise as empty element
      const xmlValue = paramValue !== undefined && paramValue !== null && paramValue !== '' 
        ? escapeXml(String(paramValue)) 
        : '';
      fieldsXml.push(`      <tns:${xmlKey}>${xmlValue}</tns:${xmlKey}>`);
    }
    
    const paramsXml = fieldsXml.join('\n');
    
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="CheckProcessing">
  <soap:Body>
    <tns:${action}>
      <tns:Client_ID>${escapeXml(clientId)}</tns:Client_ID>
      <tns:ApiPassword>${escapeXml(apiPassword)}</tns:ApiPassword>
${paramsXml}
    </tns:${action}>
  </soap:Body>
</soap:Envelope>`;
  }

  // For GetCustomerInformation, include optional fields (x_delim_data, x_delim_char) as empty elements
  // Green's backend has null reference issues if these fields are missing
  if (action === 'GetCustomerInformation') {
    const fieldsXml: string[] = [];
    
    // Required fields
    if (params.Payor_ID) {
      fieldsXml.push(`      <tns:Payor_ID>${escapeXml(String(params.Payor_ID))}</tns:Payor_ID>`);
    }
    
    // Optional fields - include as empty elements to prevent null reference errors
    fieldsXml.push(`      <tns:x_delim_data></tns:x_delim_data>`);
    fieldsXml.push(`      <tns:x_delim_char></tns:x_delim_char>`);
    
    const paramsXml = fieldsXml.join('\n');
    
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="CheckProcessing">
  <soap:Body>
    <tns:${action}>
      <tns:Client_ID>${escapeXml(clientId)}</tns:Client_ID>
      <tns:ApiPassword>${escapeXml(apiPassword)}</tns:ApiPassword>
${paramsXml}
    </tns:${action}>
  </soap:Body>
</soap:Envelope>`;
  }

  // For CustomerOneTimeDraftRTV and CustomerOneTimeDraftBV, include optional fields (x_delim_data, x_delim_char) as empty elements
  // Green's backend has null reference issues if these fields are missing
  if (action === 'CustomerOneTimeDraftRTV' || action === 'CustomerOneTimeDraftBV') {
    const fieldsXml: string[] = [];
    
    // Required fields
    if (params.Payor_ID) {
      fieldsXml.push(`      <tns:Payor_ID>${escapeXml(String(params.Payor_ID))}</tns:Payor_ID>`);
    }
    if (params.CheckAmount !== undefined && params.CheckAmount !== null) {
      fieldsXml.push(`      <tns:CheckAmount>${escapeXml(String(params.CheckAmount))}</tns:CheckAmount>`);
    }
    if (params.CheckDate) {
      fieldsXml.push(`      <tns:CheckDate>${escapeXml(String(params.CheckDate))}</tns:CheckDate>`);
    }
    if (params.CheckMemo) {
      fieldsXml.push(`      <tns:CheckMemo>${escapeXml(String(params.CheckMemo))}</tns:CheckMemo>`);
    }
    
    // Optional fields - include as empty elements to prevent null reference errors
    fieldsXml.push(`      <tns:x_delim_data></tns:x_delim_data>`);
    fieldsXml.push(`      <tns:x_delim_char></tns:x_delim_char>`);
    
    const paramsXml = fieldsXml.join('\n');
    
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="CheckProcessing">
  <soap:Body>
    <tns:${action}>
      <tns:Client_ID>${escapeXml(clientId)}</tns:Client_ID>
      <tns:ApiPassword>${escapeXml(apiPassword)}</tns:ApiPassword>
${paramsXml}
    </tns:${action}>
  </soap:Body>
</soap:Envelope>`;
  }

  // For other actions, build params XML normally
  const paramsXml = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      // Use mapped name if available
      const xmlKey = fieldNameMap[key] || key
        .replace(/([A-Z])/g, '_$1')
        .replace(/^_/, '')
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_')
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      return `      <tns:${xmlKey}>${escapeXml(String(value))}</tns:${xmlKey}>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="CheckProcessing">
  <soap:Body>
    <tns:${action}>
      <tns:Client_ID>${escapeXml(clientId)}</tns:Client_ID>
      <tns:ApiPassword>${escapeXml(apiPassword)}</tns:ApiPassword>
${paramsXml}
    </tns:${action}>
  </soap:Body>
</soap:Envelope>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Parse SOAP response XML
 * Handles nested structures like <CreateCustomerResponse><CreateCustomerResult><Payor_ID>...</Payor_ID></CreateCustomerResult></CreateCustomerResponse>
 */
function parseSOAPResponse(xml: string): any {
  // Check if this is HTML, not XML
  if (xml.trim().startsWith('<!DOCTYPE') || xml.trim().startsWith('<html')) {
    throw new Error('Response is HTML, not SOAP XML. Check API endpoint and credentials.');
  }

  const result: Record<string, any> = {};
  
  // Remove SOAP envelope and body tags, extract content
  const bodyMatch = xml.match(/<soap:Body[^>]*>(.*?)<\/soap:Body>/is);
  const content = bodyMatch ? bodyMatch[1] : xml;
  
  // If no content found, throw error
  if (!content || content.trim() === '') {
    throw new Error('Invalid SOAP response - no body content found');
  }
  
  // Extract all leaf node values (values that don't contain child elements)
  // This handles nested structures like <Response><Result><Payor_ID>12345</Payor_ID></Result></Response>
  // We want to extract Payor_ID = 12345, not the nested structure
  
  // First, find all leaf nodes (tags that contain only text, no child elements)
  // Pattern: <TagName>text content</TagName> where text content doesn't contain <
  const leafNodeRegex = /<([^:>]+)(?::[^>]+)?(?:\s+[^>]*)?>([^<]+)<\/[^>]*>/g;
  let match;
  let foundAnyTags = false;
  
  while ((match = leafNodeRegex.exec(content)) !== null) {
    foundAnyTags = true;
    const tagName = match[1].trim();
    const value = match[2].trim();
    
      // Skip empty values and common XML structure tags
      if (value && 
          !tagName.startsWith('?xml') && 
          tagName !== 'soap:Envelope' && 
          tagName !== 'soap:Body' &&
          tagName !== 'CreateCustomerResponse' &&
          tagName !== 'CreateCustomerResult' &&
          tagName !== 'CreateCustomerWithLoginResponse' &&
          tagName !== 'CreateCustomerWithLoginResult' &&
          tagName !== 'GetCustomerInformationResponse' &&
          tagName !== 'CustomerOneTimeDraftRTVResponse' &&
          tagName !== 'CustomerOneTimeDraftBVResponse') {
      
      // Normalize tag name (handle both Payor_ID and PayorId)
      const normalizedKey = tagName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Store with normalized key
      result[normalizedKey] = value;
      // Also store with original tag name for compatibility
      result[tagName] = value;
      // Store with common variations
      if (tagName.includes('_')) {
        const camelCase = tagName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelCase] = value;
      }
    }
  }
  
  // If no tags were found, try a more permissive approach
  if (!foundAnyTags) {
    // Try to extract from any tags, including nested ones
    const anyTagRegex = /<([^:>\s]+)(?::[^>]+)?(?:\s+[^>]*)?>([^<]*)<\/[^>]*>/g;
    while ((match = anyTagRegex.exec(content)) !== null) {
      const tagName = match[1].trim();
      const value = match[2].trim();
      
      if (value && 
          !tagName.startsWith('?xml') && 
          tagName !== 'soap:Envelope' && 
          tagName !== 'soap:Body' &&
          !tagName.endsWith('Response') &&
          !tagName.endsWith('Result')) {
        const normalizedKey = tagName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[normalizedKey] = value;
        result[tagName] = value;
        foundAnyTags = true;
      }
    }
  }
  
  // If still no tags found, the parsing failed
  if (!foundAnyTags) {
    throw new Error('Failed to parse SOAP response - no valid XML tags found');
  }
  
  // Validate we got some actual data
  if (Object.keys(result).length === 0) {
    throw new Error('SOAP parsing returned empty result. Response might not be valid SOAP XML.');
  }
  
  return result;
}

/**
 * Make SOAP API call to Green
 */
async function greenSOAPCall(action: string, params: Record<string, any>): Promise<any> {
  // Validate credentials are set and not empty
  const clientId = (GREEN_CLIENT_ID || '').trim();
  const apiPassword = (GREEN_API_PASSWORD || '').trim();
  
  if (!clientId || !apiPassword) {
    throw new Error("GREEN_CLIENT_ID (or GREEN_MID) and GREEN_API_PASSWORD environment variables must be set. Note: MID (Merchant ID) = Client_ID");
  }

  // Validate required fields for CreateCustomer and CreateCustomerWithLogin
  if (action === "CreateCustomer" || action === "CreateCustomerWithLogin") {
    if (!params.NameFirst || !params.NameLast) {
      throw new Error("NameFirst and NameLast are required for CreateCustomer");
    }
    // Ensure NameFirst and NameLast are not empty after trimming
    const nameFirst = String(params.NameFirst || '').trim();
    const nameLast = String(params.NameLast || '').trim();
    if (!nameFirst || !nameLast) {
      throw new Error("NameFirst and NameLast cannot be empty");
    }
    // Update params with trimmed values
    params.NameFirst = nameFirst;
    params.NameLast = nameLast;
    
    // For CreateCustomerWithLogin, UserName and Password are required
    if (action === "CreateCustomerWithLogin") {
      if (!params.UserName || !params.Password) {
        throw new Error("UserName and Password are required for CreateCustomerWithLogin");
      }
      // Ensure UserName and Password are not empty after trimming
      const userName = String(params.UserName || '').trim();
      const password = String(params.Password || '').trim();
      if (!userName || !password) {
        throw new Error("UserName and Password cannot be empty");
      }
      // Update params with trimmed values
      params.UserName = userName;
      params.Password = password;
    }
  }

  const soapEnvelope = buildSOAPEnvelope(action, params, clientId, apiPassword);

  try {
    // SOAPAction format per Green API documentation: "CheckProcessing/{action}"
    const soapAction = `"CheckProcessing/${action}"`;
    
    // Log the request for debugging (mask password)
    const logEnvelope = soapEnvelope.replace(
      /<tns:ApiPassword>(.*?)<\/tns:ApiPassword>/,
      '<tns:ApiPassword>***</tns:ApiPassword>'
    );
    console.log(`[Green API] ${action} Request:\n${logEnvelope}`);
    
    const response = await fetch(GREEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": soapAction,
      },
      body: soapEnvelope,
    });

    const responseText = await response.text();
    
    // Log the response for debugging (use console.log for success, console.error for errors)
    if (response.ok && !responseText.includes('<soap:Fault>') && !responseText.includes('<faultcode>')) {
      console.log(`[Green API] ${action} Response (${response.status}):\n${responseText.substring(0, 2000)}`);
    } else {
      console.error(`[Green API] ${action} Response (${response.status}):\n${responseText.substring(0, 2000)}`);
    }

    // Check if response contains XML/SOAP
    if (!responseText.includes('<?xml') && !responseText.includes('<soap:Envelope')) {
      console.error(`[Green API] Invalid response format - not XML/SOAP`);
      throw new Error(`Green API response is not valid SOAP XML.`);
    }

    // Check for SOAP faults (errors) - extract full fault details
    if (responseText.includes('<soap:Fault>') || responseText.includes('<faultcode>')) {
      const faultCodeMatch = responseText.match(/<faultcode[^>]*>(.*?)<\/faultcode>/is);
      const faultStringMatch = responseText.match(/<faultstring[^>]*>(.*?)<\/faultstring>/is);
      const faultDetailMatch = responseText.match(/<detail[^>]*>(.*?)<\/detail>/is);
      
      const faultCode = faultCodeMatch ? faultCodeMatch[1].trim() : 'Unknown';
      const faultString = faultStringMatch ? faultStringMatch[1].trim() : 'Unknown SOAP fault';
      const faultDetail = faultDetailMatch ? faultDetailMatch[1].trim() : '';
      
      console.error(`[Green API] SOAP Fault - Code: ${faultCode}, String: ${faultString}, Detail: ${faultDetail}`);
      throw new Error(`Green API SOAP Fault: ${faultString}${faultDetail ? ` (${faultDetail})` : ''}`);
    }

    if (!response.ok) {
      console.error(`[Green API] HTTP Error: ${response.status} ${response.statusText}`);
      throw new Error(`Green API error: ${response.status} ${response.statusText}`);
    }

    // Check if response is HTML (error page) instead of XML
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error(`[Green API] Received HTML instead of SOAP XML`);
      throw new Error(`Green API returned HTML page instead of SOAP response. Check API endpoint URL, SOAPAction header, and credentials.`);
    }

    const parsed = parseSOAPResponse(responseText);
    
    // Validate that we got actual data, not placeholder "string" values
    if (parsed.payorId === 'string' || parsed.Payor_ID === 'string') {
      throw new Error(`Failed to parse SOAP response - received placeholder values. Check API response format.`);
    }
    
    // Check for errors in response - Green API uses various result formats
    const result = parsed.result || parsed.Result || parsed.RESULT;
    const resultLower = result?.toLowerCase();
    const resultNum = result ? parseInt(String(result), 10) : null;
    
    // Check if Payor_ID exists for customer creation (check this first)
    if (action === "CreateCustomer" || action === "CreateCustomerWithLogin") {
      const payorId = parsed.payorId || parsed.Payor_ID || parsed.PAYOR_ID;
      const payorIdNum = payorId ? parseInt(String(payorId), 10) : null;
      
      // If Payor_ID is 0 or missing, it indicates failure
      if (!payorId || payorId === 'string' || payorIdNum === 0) {
        const errorMsg = parsed.resultDescription || parsed.ResultDescription || parsed.RESULT_DESCRIPTION || "Failed to create customer - no Payor_ID returned";
        throw new Error(errorMsg);
      }
    }
    
    // Check result code - success codes: "success", "approved", "0", or numeric 0
    // Any other value (including numeric error codes like 183) indicates an error
    if (result) {
      const isSuccess = resultLower === "success" || 
                       resultLower === "approved" || 
                       resultNum === 0 ||
                       result === "0";
      
      if (!isSuccess) {
        const errorMsg = parsed.resultDescription || parsed.ResultDescription || parsed.RESULT_DESCRIPTION || result || "Unknown error";
        throw new Error(errorMsg);
      }
    }

    return parsed;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Create a new customer in Green system
 */
export async function createCustomer(
  customerData: CreateCustomerRequest
): Promise<CreateCustomerResponse> {
  return greenSOAPCall("CreateCustomer", customerData);
}

/**
 * Create a new customer with login credentials
 */
export async function createCustomerWithLogin(
  customerData: CreateCustomerRequest & { UserName: string; Password: string }
): Promise<CreateCustomerResponse> {
  return greenSOAPCall("CreateCustomerWithLogin", customerData);
}

/**
 * Get customer information by Payor_ID
 */
export async function getCustomerInformation(
  Payor_ID: string
): Promise<GetCustomerInformationResponse> {
  return greenSOAPCall("GetCustomerInformation", { Payor_ID });
}

/**
 * Authenticate customer login
 */
export async function customerAuth(
  UserName: string,
  Password: string
): Promise<{ Payor_ID: string; Result: string; ResultDescription?: string }> {
  return greenSOAPCall("CustomerAuth", { UserName, Password });
}

/**
 * Process one-time draft with Real-Time Verification (RTV)
 */
export async function customerOneTimeDraftRTV(
  draftData: CustomerOneTimeDraftRequest
): Promise<CustomerOneTimeDraftResponse> {
  return greenSOAPCall("CustomerOneTimeDraftRTV", draftData);
}

/**
 * Process one-time draft with Batch Verification (BV)
 */
export async function customerOneTimeDraftBV(
  draftData: CustomerOneTimeDraftRequest
): Promise<CustomerOneTimeDraftResponse> {
  return greenSOAPCall("CustomerOneTimeDraftBV", draftData);
}

/**
 * Get Plaid iframe URL for bank login
 * MID (Merchant ID) is used as the client_id parameter in the iframe URL
 * Per Green API documentation: https://greenbyphone.com/Plaid?client_id={MID}&customer_id={Payor_ID}
 */
export function getPlaidIframeUrl(payorId: string): string {
  if (!payorId || typeof payorId !== 'string' || payorId.trim() === '') {
    throw new Error(`Invalid Payor_ID provided to getPlaidIframeUrl: ${payorId}`);
  }
  
  const mid = GREEN_CLIENT_ID; // MID = Merchant ID = Client_ID
  if (!mid || mid.trim() === '') {
    throw new Error('GREEN_CLIENT_ID (or GREEN_MID) environment variable is not set');
  }
  
  // Per Green API documentation, the iframe URL format is:
  // https://greenbyphone.com/Plaid?client_id={MID}&customer_id={Payor_ID}
  const url = `https://greenbyphone.com/Plaid?client_id=${encodeURIComponent(mid)}&customer_id=${encodeURIComponent(payorId)}`;
  return url;
}

