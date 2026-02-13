export default function DisclaimerPage() {
  return (
    <div className="py-12">
      <div className="container-custom max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Research Disclaimer</h1>
        
        <div className="prose prose-lg max-w-none">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
            <h2 className="text-red-900 font-bold text-2xl mb-4">⚠️ IMPORTANT NOTICE</h2>
            <p className="text-red-800 text-lg font-semibold">
              ALL PRODUCTS SOLD BY PURGO LABS ARE FOR RESEARCH PURPOSES ONLY. 
              THEY ARE NOT INTENDED FOR HUMAN OR ANIMAL CONSUMPTION OR ANY CLINICAL USE.
            </p>
          </div>

          <h2>Research Use Only</h2>
          <p>
            All products sold by Purgo Style Labs are intended for their designated use. 
            applications. These products are NOT:
          </p>
          <ul>
            <li>Approved by the FDA or any regulatory agency for human use</li>
            <li>Intended for human or animal consumption</li>
            <li>Intended for diagnostic purposes</li>
            <li>Intended for therapeutic or medicinal purposes</li>
            <li>Intended as food additives, supplements, or cosmetics</li>
            <li>Suitable for self-administration or uncontrolled experimentation</li>
          </ul>

          <h2>Buyer Qualifications</h2>
          <p>
            By purchasing from Purgo Style Labs, you represent and warrant that:
          </p>
          <ul>
            <li>You are a qualified research professional or institution</li>
            <li>You have appropriate training and licensing to handle research chemicals</li>
            <li>You will use products only in controlled laboratory settings</li>
            <li>You understand the risks associated with handling research compounds</li>
            <li>You will comply with all applicable laws and regulations</li>
          </ul>

          <h2>No Medical Claims</h2>
          <p>
            Purgo Style Labs makes no medical claims about any of our products. Any information provided about products and 
            their properties is for educational and research purposes only and should not be construed as medical advice.
          </p>

          <h2>Safety and Handling</h2>
          <p>
            Research peptides must be handled with appropriate safety precautions:
          </p>
          <ul>
            <li>Use appropriate personal protective equipment (PPE)</li>
            <li>Work in a properly equipped laboratory environment</li>
            <li>Follow proper storage and disposal procedures</li>
            <li>Refer to Safety Data Sheets (SDS) for handling information</li>
            <li>Keep products away from children and unauthorized persons</li>
          </ul>

          <h2>Liability</h2>
          <p>
            Purgo Style Labs assumes no responsibility for:
          </p>
          <ul>
            <li>Misuse of products outside of research settings</li>
            <li>Any harm resulting from improper handling or use</li>
            <li>Results obtained from research using our products</li>
            <li>Compliance with local laws and regulations</li>
            <li>Any consequences of product use outside stated purposes</li>
          </ul>

          <h2>Prohibited Uses</h2>
          <p>
            The following uses are strictly prohibited:
          </p>
          <ul>
            <li>Human consumption or administration</li>
            <li>Animal consumption or veterinary use</li>
            <li>Use in food or beverage production</li>
            <li>Use in cosmetic or supplement manufacturing</li>
            <li>Any clinical or diagnostic application</li>
            <li>Resale as consumable products</li>
          </ul>

          <h2>Certification of Compliance</h2>
          <p>
            By completing a purchase, you certify that you:
          </p>
          <ul>
            <li>Have read and understood this disclaimer</li>
            <li>Agree to use products only for research purposes</li>
            <li>Accept full responsibility for proper product use</li>
            <li>Will not hold Purgo Style Labs liable for misuse</li>
            <li>Understand that violation may result in legal consequences</li>
          </ul>

          <h2>Regulatory Status</h2>
          <p>
            Our research peptides are not approved by the FDA, EMA, or any other regulatory agency for human or animal 
            use. They have not been evaluated for safety or efficacy in humans. The sale of these products does not 
            constitute an offer to sell for prohibited purposes.
          </p>

          <h2>Contact Information</h2>
          <p>
            For questions about proper research use of our products, please contact our support team at 
            support@purgostyle.com
          </p>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mt-8">
            <p className="text-yellow-900 font-semibold">
              By purchasing from Purgo Style Labs, you acknowledge that you have read, understood, and agree to comply with 
              all terms of this disclaimer and our Terms of Service.
            </p>
          </div>

          <p className="text-sm text-gray-600 mt-8">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

