#!/bin/bash

# Green API CreateCustomer Test Script with actual credentials

curl -X POST https://greenbyphone.com/eCheck.asmx \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H 'SOAPAction: "CheckProcessing/CreateCustomer"' \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CreateCustomer xmlns="CheckProcessing">
      <Client_ID>118357</Client_ID>
      <ApiPassword>gm9cm2jm5ko</ApiPassword>
      <NameFirst>Max</NameFirst>
      <NameLast>Danley</NameLast>
      <EmailAddress>huskerpackers@gmail.com</EmailAddress>
      <PhoneWork>4027306412</PhoneWork>
    </CreateCustomer>
  </soap:Body>
</soap:Envelope>'
