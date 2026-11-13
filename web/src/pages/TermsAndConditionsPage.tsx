import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsAndConditionsPage: React.FC = () => {
  const lastUpdatedDate = 'November 11, 2026';

  return (
    <div className="bg-[#EAF6FF] text-[#142B4A] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-[#142B4A] hover:text-[#FF8C42] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Return to Platform Home</span>
        </Link>

        <div className="border-b border-[#142B4A]/20 pb-8 mb-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#142B4A] tracking-tight">Terms and Conditions</h1>
              <p className="text-xs text-[#142B4A]/70 mt-1 font-medium">
                Effective Date & Last Updated: {lastUpdatedDate}
              </p>
            </div>
          </div>
          <p className="text-[#142B4A]/85 text-sm leading-relaxed">
            These Terms and Conditions constitute a legally binding agreement between PG Management SaaS and the Customer (Property Owner, Operator, or Organization) governing the use of the web portal, backend API, and mobile applications.
          </p>
        </div>

        <div className="space-y-10 text-[#142B4A]/90 text-sm leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">1.</span> License Grant & Multi-Tenant Access
            </h2>
            <p className="mb-3">
              Subject to payment of applicable subscription tiers and compliance with these Terms, PG Management SaaS grants Customer a non-exclusive, non-transferable, revocable license to access and utilize the platform solely for internal property management operations.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#142B4A]/80">
              <li>Customer may create administrative staff accounts and provision resident portal access up to subscribed unit/bed limits.</li>
              <li>Customer may not sublicense, reverse-engineer, decompile, or create derivative works of the backend codebase, API protocols, or mobile clients.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">2.</span> Customer Responsibilities & Tenant Verification
            </h2>
            <p className="mb-3">
              Customer retains full accountability for:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#142B4A]/80">
              <li>Ensuring that all tenant identification details and KYC documents collected adhere to local municipal laws and police registration ordinances.</li>
              <li>Maintaining the confidentiality of administrative credentials, API access tokens, and staff login permissions.</li>
              <li>Promptly revoking access for discharged wardens, property managers, or former employees.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">3.</span> Financial Transactions & Rent Dues
            </h2>
            <p className="text-[#142B4A]/85">
              The software calculates rent cycles, utility add-ons, and late penalty charges based on parameters configured by the Customer. PG Management SaaS functions solely as an administrative record-keeping system. We are not a banking institution and do not hold security deposits in escrow. Any disputes regarding deposit deductions, room refunds, or physical room conditions remain exclusively between the Property Owner and the Resident.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">4.</span> Acceptable Use & Security Prohibitions
            </h2>
            <p className="mb-3">
              Users may not under any circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#142B4A]/80">
              <li>Attempt to bypass or probe multi-tenant row isolation boundaries, rate limit filters, or API authentication headers.</li>
              <li>Inject malicious payloads, scripts, or automated crawling bots into tenant forms or image upload fields.</li>
              <li>Use the platform to distribute spam SMS notifications or unauthorized commercial broadcasts to residents.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">5.</span> Service Availability & SLA
            </h2>
            <p className="text-[#142B4A]/85">
              We target 99.9% uptime for core API services, excluding scheduled maintenance windows announced at least 48 hours in advance. In the event of system interruptions, our liability is strictly limited to the proportional subscription fees paid for the affected monthly period.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">6.</span> Custom Domain Ownership & SSL
            </h2>
            <p className="text-[#142B4A]/85">
              When Customer maps a custom domain (e.g.,{' '}
              <span className="text-[#142B4A] font-semibold font-mono bg-[#D5EBFC] px-1.5 py-0.5 rounded">
                app.yourpgchain.com
              </span>
              ), Customer is responsible for retaining active ownership of the domain with their registrar and maintaining valid DNS A/CNAME records directing traffic to the designated reverse proxy IP.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">7.</span> Termination & Account Suspension
            </h2>
            <p className="text-[#142B4A]/85">
              Either party may terminate services with 30 days written notice. We reserve the right to suspend accounts immediately upon evidence of security tampering, fraudulent KYC uploads, or non-payment of SaaS subscription tiers.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-semibold text-[#142B4A] mb-3 flex items-center">
              <span className="text-[#FF8C42] font-bold mr-2">8.</span> Governing Law & Contact
            </h2>
            <p className="text-[#142B4A]/85">
              These Terms shall be interpreted and enforced under the laws of the applicable commercial jurisdiction. For legal notices, reach out to:{' '}
              <span className="text-[#142B4A] font-semibold font-mono bg-[#D5EBFC] px-1.5 py-0.5 rounded">
                legal@pgmanagement.internal
              </span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
