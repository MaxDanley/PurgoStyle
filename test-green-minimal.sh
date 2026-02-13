#!/bin/bash

# Minimal test with only required fields
echo "Testing with only required fields (NameFirst, NameLast)..."
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
    </CreateCustomer>
  </soap:Body>
</soap:Envelope>'

echo -e "\n\nTesting with NickName added..."
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
      <NickName>TestCustomer</NickName>
    </CreateCustomer>
  </soap:Body>
</soap:Envelope>'
