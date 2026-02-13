/**
 * Validation utilities for order creation
 */

/**
 * Validates and parses a full name into first and last name
 * @param fullName - The full name string
 * @returns Object with firstName and lastName, or throws error if invalid
 */
export function parseAndValidateName(fullName: string | undefined | null): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') {
    throw new Error("Name is required");
  }

  const trimmedName = fullName.trim();
  
  if (trimmedName.length === 0) {
    throw new Error("Name cannot be empty");
  }

  // Split name by whitespace
  const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length < 2) {
    throw new Error("Please enter your full name (first and last name)");
  }

  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  if (firstName.length < 1) {
    throw new Error("First name is required");
  }

  if (lastName.length < 1) {
    throw new Error("Last name is required");
  }

  return { firstName, lastName };
}

/**
 * Validates an email address
 * @param email - The email string to validate
 * @returns The trimmed email if valid, or throws error if invalid
 */
export function validateEmail(email: string | undefined | null): string {
  if (!email || typeof email !== 'string') {
    throw new Error("Email is required");
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    throw new Error("Email cannot be empty");
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address");
  }

  return trimmedEmail;
}

/**
 * Validates guest order information (name and email)
 * @param shippingInfo - Shipping information object
 * @param metadata - Order metadata (may contain userEmail for logged-in users)
 * @returns Object with validated firstName, lastName, and email
 */
export function validateGuestOrderInfo(
  shippingInfo: { name?: string; email?: string },
  metadata?: { userEmail?: string; userId?: string }
): { firstName: string; lastName: string; email: string } {
  // For logged-in users, use user email from metadata if available
  // Otherwise, validate guest email from shippingInfo
  let email: string;
  
  if (metadata?.userId && metadata?.userEmail) {
    // Logged-in user - use their account email
    email = validateEmail(metadata.userEmail);
  } else {
    // Guest user - must provide email
    email = validateEmail(shippingInfo.email);
  }

  // Always validate name (both logged-in and guest users need shipping name)
  const { firstName, lastName } = parseAndValidateName(shippingInfo.name);

  return { firstName, lastName, email };
}

