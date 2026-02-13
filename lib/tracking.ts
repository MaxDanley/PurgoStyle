// TrackingMore API integration
// Free tier: 50 shipments/month
// Documentation: https://www.trackingmore.com/api-doc.html

interface TrackingResponse {
  code: number;
  data: {
    tracking_number: string;
    carrier_code: string;
    status: string;
    original_country: string;
    destination_country: string;
    item_name: string;
    last_event: string;
    last_status: string;
    last_location: string;
    last_time: string;
    origin: string;
    destination: string;
    service: string;
    weight: string;
    trackinfo: Array<{
      date: string;
      status: string;
      location: string;
      details: string;
    }>;
  };
}

export class TrackingMoreAPI {
  private apiKey: string;
  private baseUrl = 'https://api.trackingmore.com/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async trackPackage(trackingNumber: string, _carrierCode: string = 'usps'): Promise<TrackingResponse> {
    const response = await fetch(`${this.baseUrl}/trackings/get`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      // Note: TrackingMore uses query parameters for GET requests
    });

    if (!response.ok) {
      throw new Error(`TrackingMore API error: ${response.status}`);
    }

    return response.json();
  }

  async createTracking(trackingNumber: string, carrierCode: string = 'usps', orderId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/trackings/post`, {
      method: 'POST',
      headers: {
        'Tracking-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tracking_number: trackingNumber,
        carrier_code: carrierCode,
        title: `Order ${orderId || 'Unknown'}`,
        customer_name: '',
        customer_email: '',
        order_id: orderId,
        lang: 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tracking: ${response.status}`);
    }

    return response.json();
  }

  async getTrackingUpdates(trackingNumber: string, carrierCode: string = 'usps'): Promise<TrackingResponse> {
    // First, try to get tracking if it already exists
    let response = await fetch(`${this.baseUrl}/trackings/get?tracking_number=${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Tracking-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // If tracking doesn't exist (404), create it first
    if (response.status === 404) {
      console.log(`📦 Tracking ${trackingNumber} not found, creating it first...`);
      await this.createTracking(trackingNumber, carrierCode);
      
      // Wait a moment for the tracking to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try again
      response = await fetch(`${this.baseUrl}/trackings/get?tracking_number=${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Tracking-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get tracking updates: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

// USPS Modern API with OAuth (completely free)
export class USPSAPI {
  private consumerKey: string;
  private consumerSecret: string;
  // Store tokens per scope
  private tokenCache: Map<string, { token: string; expiry: number }> = new Map();
  // USPS API v3 base URLs
  // Production: https://apis.usps.com
  // Testing (TEM): https://apis-tem.usps.com
  private baseUrl = process.env.USPS_API_ENV === 'tem' 
    ? 'https://apis-tem.usps.com' 
    : 'https://apis.usps.com';

  constructor(consumerKey: string, consumerSecret: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  private async getAccessToken(scope: string = 'tracking'): Promise<string> {
    // Check if we have a valid token for this scope
    const cached = this.tokenCache.get(scope);
    if (cached && Date.now() < cached.expiry) {
      return cached.token;
    }

    // Validate credentials are present
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('USPS credentials are missing. Please set USPS_CONSUMER_KEY and USPS_CONSUMER_SECRET environment variables.');
    }

    try {
      // USPS OAuth 2.0 endpoint - correct endpoint per USPS documentation
      // Production: https://apis.usps.com/oauth2/v3/token
      // Testing: https://apis-tem.usps.com/oauth2/v3/token
      const tokenUrl = `${this.baseUrl}/oauth2/v3/token`;
      
      console.log('🔐 Requesting USPS OAuth token from:', tokenUrl);
      console.log('🔑 Using Consumer Key:', this.consumerKey.substring(0, 10) + '...');
      
      // USPS OAuth 2.0 client credentials flow
      // According to USPS docs, request should be JSON format
      const requestBody: Record<string, string> = {
        grant_type: 'client_credentials',
        client_id: this.consumerKey,
        client_secret: this.consumerSecret,
        scope: scope,
      };
      
      console.log('📋 OAuth request scope:', scope);
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log('📥 USPS OAuth response status:', response.status);
      console.log('📥 USPS OAuth response:', responseText.substring(0, 200));

      if (!response.ok) {
        let errorMessage = `USPS OAuth error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error_description || errorData.error || errorMessage;
          console.error('❌ USPS OAuth error details:', errorData);
        } catch {
          console.error('❌ USPS OAuth error response (non-JSON):', responseText);
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      
      if (!data.access_token) {
        throw new Error('USPS OAuth response missing access_token');
      }

      // Cache the token for this scope
      this.tokenCache.set(scope, {
        token: data.access_token,
        expiry: Date.now() + (data.expires_in * 1000) - 60000, // 1 minute buffer
      });

      console.log('✅ USPS OAuth token obtained successfully for scope:', scope);
      return data.access_token;
    } catch (error) {
      console.error('❌ Failed to get USPS access token:', error);
      if (error instanceof Error) {
        throw new Error(`USPS OAuth failed: ${error.message}`);
      }
      throw error;
    }
  }

  async trackPackage(trackingNumber: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      
      // USPS Tracking API v3.2
      // Documentation: https://developers.usps.com/trackingv3r2
      // Production: https://apis.usps.com/tracking/v3r2/tracking
      // Testing: https://apis-tem.usps.com/tracking/v3r2/tracking
      const trackingUrl = `${this.baseUrl}/tracking/v3r2/tracking`;
      
      console.log('📦 Requesting tracking info for:', trackingNumber);
      console.log('🔗 Tracking endpoint:', trackingUrl);
      
      const response = await fetch(trackingUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber: trackingNumber,
        }),
      });

      const responseText = await response.text();
      console.log('📥 Tracking response status:', response.status);
      console.log('📥 Tracking response body:', responseText.substring(0, 500));

      if (!response.ok) {
        let errorMessage = `USPS Tracking API error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error_description || errorData.error || errorData.message || errorMessage;
          console.error('❌ USPS Tracking error details:', errorData);
        } catch {
          console.error('❌ USPS Tracking error response:', responseText.substring(0, 200));
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('❌ Failed to parse tracking response:', responseText.substring(0, 200));
        throw new Error('Invalid JSON response from USPS Tracking API');
      }

      return this.parseModernUSPSResponse(data, trackingNumber);
    } catch (error) {
      console.error('❌ USPS Tracking API error:', error);
      // Return basic tracking info if API fails
      return {
        status: 'In Transit',
        summary: 'Package is being processed',
        location: 'Processing Facility',
        date: new Date().toISOString(),
        events: [],
        lastUpdate: new Date().toISOString()
      };
    }
  }

  async trackMultiplePackages(trackingNumbers: string[]): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      // USPS Tracking API v3.2 - Batch tracking
      // Documentation: https://developers.usps.com/trackingv3r2
      // Production: https://apis.usps.com/tracking/v3r2/tracking/batch
      // Testing: https://apis-tem.usps.com/tracking/v3r2/tracking/batch
      const batchUrl = `${this.baseUrl}/tracking/v3r2/tracking/batch`;
      
      console.log('📦 Requesting batch tracking for', trackingNumbers.length, 'packages');
      
      const response = await fetch(batchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          trackingNumbers: trackingNumbers,
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('❌ USPS Batch Tracking error:', response.status, responseText.substring(0, 200));
        throw new Error(`USPS Batch Tracking API error: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('❌ Failed to parse batch tracking response');
        return [];
      }

      return this.parseMultipleModernUSPSResponse(data);
    } catch (error) {
      console.error('❌ USPS Batch Tracking API error:', error);
      return [];
    }
  }

  private parseModernUSPSResponse(data: any, _trackingNumber: string): any {
    try {
      // Parse the modern USPS API response
      if (data.trackingInfo && data.trackingInfo.length > 0) {
        const trackingInfo = data.trackingInfo[0];
        const events: any[] = [];

        // Extract tracking events
        if (trackingInfo.trackingEvents && trackingInfo.trackingEvents.length > 0) {
          trackingInfo.trackingEvents.forEach((event: any) => {
            events.push({
              status: event.eventDescription || event.status || 'Unknown',
              location: event.location || event.city || '',
              date: event.eventDate || '',
              time: event.eventTime || '',
              timestamp: event.eventDateTime ? new Date(event.eventDateTime).toISOString() : new Date().toISOString()
            });
          });
        }

        return {
          status: trackingInfo.status || 'Unknown',
          summary: trackingInfo.summary || trackingInfo.statusDescription || '',
          location: trackingInfo.currentLocation || '',
          date: trackingInfo.lastEventDate || '',
          time: trackingInfo.lastEventTime || '',
          events: events,
          lastUpdate: events.length > 0 ? events[0].timestamp : new Date().toISOString()
        };
      }

      return {
        status: 'Unknown',
        summary: 'No tracking information available',
        location: '',
        date: '',
        time: '',
        events: [],
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing modern USPS response:', error);
      return {
        status: 'Unknown',
        summary: 'Unable to parse tracking information',
        location: '',
        date: '',
        time: '',
        events: [],
        lastUpdate: new Date().toISOString()
      };
    }
  }

  private parseMultipleModernUSPSResponse(data: any): any[] {
    const results: any[] = [];
    
    if (data.trackingInfo && Array.isArray(data.trackingInfo)) {
      data.trackingInfo.forEach((trackingInfo: any) => {
        if (trackingInfo.trackingNumber) {
          const result = this.parseModernUSPSResponse({ trackingInfo: [trackingInfo] }, trackingInfo.trackingNumber);
          result.trackingNumber = trackingInfo.trackingNumber;
          results.push(result);
        }
      });
    }

    return results;
  }

  // Get delivery confirmation using modern API
  async getDeliveryConfirmation(trackingNumber: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(`${this.baseUrl}/shipping/v1/delivery-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber: trackingNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`USPS API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseDeliveryConfirmation(data);
    } catch (error) {
      console.error('USPS Delivery Confirmation error:', error);
      return null;
    }
  }

  private parseDeliveryConfirmation(data: any): any {
    return {
      signature: data.signatureName || null,
      deliveryDate: data.deliveryDate || null,
      deliveryTime: data.deliveryTime || null,
    };
  }

  // Address Validation API
  async validateAddress(address: {
    streetAddress: string;
    secondaryAddress?: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<{
    isValid: boolean;
    standardizedAddress?: {
      streetAddress: string;
      secondaryAddress?: string;
      city: string;
      state: string;
      zipCode: string;
      zip4?: string;
    };
    error?: string;
    isApiError?: boolean; // Flag to indicate API/auth errors vs actual invalid address
  }> {
    try {
      // Use "addresses" scope for address validation API
      const token = await this.getAccessToken('addresses');
      
      // USPS Address API v3
      // Documentation: https://developers.usps.com/addresses
      const addressUrl = `${this.baseUrl}/addresses/v3/address`;
      
      console.log('📍 Validating address:', address.streetAddress, address.city, address.state);
      
      // Build query parameters for GET request
      const params = new URLSearchParams({
        streetAddress: address.streetAddress,
        city: address.city,
        state: address.state,
        ZIPCode: address.zipCode,
      });
      
      if (address.secondaryAddress) {
        params.append('secondaryAddress', address.secondaryAddress);
      }
      
      const fullUrl = `${addressUrl}?${params.toString()}`;
      console.log('📤 USPS Address validation request:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log('📥 Address validation response status:', response.status);
      console.log('📥 Address validation response body:', responseText);
      
      if (!response.ok) {
        console.error('❌ USPS Address validation error:', response.status, responseText);
        
        // Check if it's an "Address Not Found" error (400) - this is a real invalid address
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error?.message === 'Address Not Found' || 
              errorData.error?.errors?.some((e: any) => e.title === 'Address Not Found' || e.code === '010005')) {
            console.log('📍 Address confirmed as not found by USPS');
            return {
              isValid: false,
              error: 'Address not found',
              isApiError: false,
            };
          }
        } catch {
          // Couldn't parse error response
        }
        
        // For other API errors (auth, scope, etc), don't show warning to user
        return {
          isValid: true, // Treat as valid so we don't show warning for API errors
          error: 'Unable to validate address with USPS',
          isApiError: true,
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error('❌ Failed to parse address validation response:', responseText);
        return {
          isValid: true, // Treat as valid so we don't show warning for parse errors
          error: 'Invalid response from USPS',
          isApiError: true,
        };
      }

      console.log('📋 Parsed USPS response:', JSON.stringify(data, null, 2));

      // Check if response has an error (API error, not invalid address)
      if (data.error) {
        console.log('⚠️ USPS API returned error:', data.error);
        return {
          isValid: true, // Treat as valid so we don't show warning for API errors
          error: data.error.message || 'USPS API error',
          isApiError: true,
        };
      }

      // Check if the response contains a valid address
      if (data.address) {
        console.log('✅ Address is valid, standardized address:', data.address);
        return {
          isValid: true,
          standardizedAddress: {
            streetAddress: data.address.streetAddress || address.streetAddress,
            secondaryAddress: data.address.secondaryAddress,
            city: data.address.city || address.city,
            state: data.address.state || address.state,
            zipCode: data.address.ZIPCode || address.zipCode,
            zip4: data.address.ZIPPlus4,
          },
        };
      }

      // If no address in response, it's actually invalid
      console.log('❌ No address field in response, address is invalid');
      return {
        isValid: false,
        error: 'Address not found',
        isApiError: false,
      };
    } catch (error) {
      console.error('❌ USPS Address validation error:', error);
      return {
        isValid: true, // Treat as valid so we don't show warning for API errors
        error: 'Failed to validate address',
        isApiError: true,
      };
    }
  }
}

// Utility functions
export function getCarrierFromTrackingNumber(trackingNumber: string): string {
  // USPS tracking number patterns
  if (/^[0-9]{20}$/.test(trackingNumber)) return 'usps'; // Priority Mail Express
  if (/^[0-9]{13}$/.test(trackingNumber)) return 'usps'; // Priority Mail
  if (/^[0-9]{12}$/.test(trackingNumber)) return 'usps'; // First-Class Mail
  if (/^[A-Z]{2}[0-9]{9}US$/.test(trackingNumber)) return 'usps'; // International
  
  // UPS tracking number patterns
  if (/^1Z[0-9A-Z]{16}$/.test(trackingNumber)) return 'ups';
  if (/^[0-9]{9}$/.test(trackingNumber)) return 'ups';
  
  // FedEx tracking number patterns
  if (/^[0-9]{12}$/.test(trackingNumber)) return 'fedex';
  if (/^[0-9]{14}$/.test(trackingNumber)) return 'fedex';
  
  // Default to USPS
  return 'usps';
}

export function formatTrackingStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'InTransit': 'In Transit',
    'Delivered': 'Delivered',
    'Exception': 'Exception',
    'Pending': 'Pending',
    'PickUp': 'Ready for Pickup',
    'OutForDelivery': 'Out for Delivery',
    'AttemptFail': 'Delivery Attempt Failed',
  };
  
  return statusMap[status] || status;
}
