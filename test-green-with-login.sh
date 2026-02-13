#!/bin/bash

# Green API CreateCustomerWithLogin Test Script

curl -X POST \
 -H "Content-Type: text/xml" \
 -H "SOAPAction: \"CheckProcessing/CreateCustomerWithLogin\"" \
 -d '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
         <soap:Body>
             <CreateCustomerWithLogin xmlns="CheckProcessing">
                 <Client_ID>118357</Client_ID>
                 <ApiPassword>gm9cm2jm5ko</ApiPassword>
                 <NameFirst>Max</NameFirst>
                 <NameLast>Danley</NameLast>
                 <EmailAddress>huskerpackers@gmail.com</EmailAddress>
                 <PhoneWork>4027306412</PhoneWork>
                 <UserName>testuser123</UserName>
                 <Password>testpass123</Password>
             </CreateCustomerWithLogin>
         </soap:Body>
     </soap:Envelope>' \
 https://greenbyphone.com/eCheck.asmx
