import React from 'react';
import { Shield, Lock, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  const lastUpdatedDate = 'November 11, 2026';

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span>Return to Platform Home</span>
      </Link>

      <div className="border-b border-slate-800 pb-8 mb-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-1">Effective Date & Last Updated: {lastUpdatedDate}</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          This Privacy Policy describes how the PG Management SaaS platform collects, stores, protects, and handles personal data belonging to property owners, staff members, and residents (tenants).
        </p>
      </div>

      <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
        {/* Section 1 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">1.</span> Scope and Multi-Tenant Role Definitions
          </h2>
          <p className="mb-3">
            In our multi-tenant SaaS architecture:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li><strong className="text-slate-200">Property Owners (Data Controllers):</strong> Determine what tenant data is gathered for local tenancy verification, lease agreements, and rent calculation.</li>
            <li><strong className="text-slate-200">PG Management SaaS (Data Processor):</strong> Provides the secure cloud and mobile infrastructure that processes, encrypts, and retains this data strictly on behalf of the Property Owner.</li>
            <li><strong className="text-slate-200">Tenants & Staff (Data Subjects):</strong> Individuals whose account information, identification records, or maintenance logs are stored in the platform.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">2.</span> Categories of Information Collected
          </h2>
          <div className="space-y-4">
            <div className="border border-slate-800 bg-slate-900/50 p-4 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">A. Account & Profile Records</h3>
              <p className="text-xs text-slate-400">Full legal names, business email addresses, telephone numbers, encrypted passwords, and assigned organizational roles.</p>
            </div>
            <div className="border border-slate-800 bg-slate-900/50 p-4 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">B. Tenant Verification & KYC Data</h3>
              <p className="text-xs text-slate-400">Government ID copies (Aadhaar, Passport, Voter ID, Driver License) uploaded for tenancy verification, emergency contact numbers, and check-in/check-out dates.</p>
            </div>
            <div className="border border-slate-800 bg-slate-900/50 p-4 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">C. Financial & Transaction Logs</h3>
              <p className="text-xs text-slate-400">Agreed monthly rent amounts, security deposit ledgers, invoice issuance numbers, payment timestamps, and payment statuses. Note: Raw payment card numbers and CVV codes are never stored on our servers.</p>
            </div>
            <div className="border border-slate-800 bg-slate-900/50 p-4 rounded-md">
              <h3 className="font-semibold text-slate-200 mb-1">D. System & Security Telemetry</h3>
              <p className="text-xs text-slate-400">IP addresses, login timestamps, failed authentication counter logs, and user-agent strings recorded strictly for audit trails and rate limiting enforcement.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">3.</span> Multi-Tenant Data Isolation Guarantee
          </h2>
          <p>
            We enforce strict logical and programmatic data separation. Every database record is stamped with a unique organization identifier. Database repositories and service layers execute queries exclusively with tenant-scoped predicates (`WHERE organization_id = :orgId`). No property owner or staff member can view, query, or mutate the records of another property organization.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">4.</span> Cryptographic Standards & Data Security
          </h2>
          <p className="mb-3">
            All user data is guarded by the following technical safeguards:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li><strong className="text-slate-200">Encryption in Transit:</strong> Mandatory HTTPS with TLS 1.3 and HSTS (Strict-Transport-Security: 31536000).</li>
            <li><strong className="text-slate-200">Password Hashing:</strong> BCrypt algorithm with a computational work factor of 12 with individual cryptographic salt per user.</li>
            <li><strong className="text-slate-200">Hardware Keystore:</strong> Mobile access tokens are stored in Android Keystore / iOS Keychain via secure store APIs, never in unencrypted web storage.</li>
            <li><strong className="text-slate-200">Rate Limiting:</strong> Bucket4j token bucket rate limiting on authentication and API endpoints to halt automated brute-force scraping.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">5.</span> Zero Third-Party Advertising Policy
          </h2>
          <p>
            We do not sell, rent, monetize, or trade personal data or tenant KYC records to third-party advertisers, data brokers, or external analytics firms. We do not use third-party behavioral tracking pixels or canvas fingerprinting.
          </p>
        </section>

        {/* Section 6 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">6.</span> Data Retention and Deletion
          </h2>
          <p>
            Tenant and lease records are preserved for the active duration of the tenancy agreement and any legally mandated financial record retention periods. Upon organizational contract termination, property owners may export tenant archives in standardized formats, after which data is purged in accordance with our deletion cycle.
          </p>
        </section>

        {/* Section 7 */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
            <span className="text-blue-400 mr-2">7.</span> User Data Rights & Inquiries
          </h2>
          <p>
            Depending on applicable jurisdiction, data subjects possess the right to access their stored personal records, request rectification of erroneous data, and request account deactivation. Inquiries regarding data processing may be addressed to our administrative office at: <span className="text-slate-200 font-mono">privacy@pgmanagement.internal</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
