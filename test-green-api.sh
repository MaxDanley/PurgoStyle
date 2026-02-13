#!/bin/bash

# Green API CreateCustomer Test Script
# Replace CLIENT_ID and API_PASSWORD with your actual credentials

CLIENT_ID="118357"  # Replace with your actual Client_ID (MID)
API_PASSWORD="YOUR_API_PASSWORD_HERE"  # Replace with your actual API password

# Test data
NAME_FIRST="Max"
NAME_LAST="Danley"
EMAIL_ADDRESS="huskerpackers@gmail.com"
PHONE_WORK="4027306412"

# SOAP Request
curl -X POST https://greenbyphone.com/eCheck.asmx \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H 'SOAPAction: "CheckProcessing/CreateCustomer"' \
  -d "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">
  <soap:Body>
    <CreateCustomer xmlns=\"CheckProcessing\">
      <Client_ID>${CLIENT_ID}</Client_ID>
      <ApiPassword>${API_PASSWORD}</ApiPassword>
      <NameFirst>${NAME_FIRST}</NameFirst>
      <NameLast>${NAME_LAST}</NameLast>
      <EmailAddress>${EMAIL_ADDRESS}</EmailAddress>
      <PhoneWork>${PHONE_WORK}</PhoneWork>
    </CreateCustomer>
  </soap:Body>
</soap:Envelope>"

