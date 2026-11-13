import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  Database,
  Smartphone,
  Server,
  FileCheck2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#EAF6FF] text-[#142B4A]">
      {/* Hero Section */}
      <section className="border-b border-[#142B4A]/15 bg-[#EAF6FF] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#142B4A]/20 bg-[#F4FAFF] px-3.5 py-1 text-xs font-semibold text-[#142B4A] mb-8">
            <span className="flex h-2 w-2 rounded-full bg-[#FF8C42]"></span>
            <span>Zero-Trust Enterprise Property Management Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#142B4A] max-w-4xl mx-auto leading-tight">
            Paying Guest and Hostel Property Management System
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#142B4A]/85 max-w-3xl mx-auto leading-relaxed font-normal">
            Centralize branch operations, room allocation, monthly rent dues, and tenant onboarding in one unified platform. Engineered with strict multi-tenant row-level data isolation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-[#FF8C42] px-6 py-3 text-sm font-semibold text-[#142B4A] hover:bg-[#E8752E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C42] transition-colors"
            >
              <span>Explore Operational Modules</span>
              <ArrowRight className="ml-2 h-4 w-4 text-[#142B4A]" />
            </a>

            <Link
              to="/domain-setup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-[#142B4A] px-6 py-3 text-sm font-semibold text-[#EAF6FF] hover:bg-[#1D3D63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C42] transition-colors"
            >
              <span>Custom Domain Setup Guide</span>
            </Link>
          </div>

          <div className="mt-14 pt-8 border-t border-[#142B4A]/15 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="border-l-2 border-[#FF8C42] pl-4">
              <div className="text-xs text-[#142B4A]/70 uppercase tracking-wider font-semibold">Architecture</div>
              <div className="text-sm font-semibold text-[#142B4A] mt-1">Spring Boot 3.3 REST</div>
            </div>
            <div className="border-l-2 border-[#FF8C42] pl-4">
              <div className="text-xs text-[#142B4A]/70 uppercase tracking-wider font-semibold">Mobile Client</div>
              <div className="text-sm font-semibold text-[#142B4A] mt-1">React Native (Expo 52)</div>
            </div>
            <div className="border-l-2 border-[#FF8C42] pl-4">
              <div className="text-xs text-[#142B4A]/70 uppercase tracking-wider font-semibold">Data Storage</div>
              <div className="text-sm font-semibold text-[#142B4A] mt-1">PostgreSQL 16 Multi-Tenant</div>
            </div>
            <div className="border-l-2 border-[#FF8C42] pl-4">
              <div className="text-xs text-[#142B4A]/70 uppercase tracking-wider font-semibold">Security</div>
              <div className="text-sm font-semibold text-[#142B4A] mt-1">BCrypt 12 & Rate Limiting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Operational Modules Section */}
      <section id="features" className="py-20 bg-[#D5EBFC]/45 border-b border-[#142B4A]/15 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider inline-block border-b-2 border-[#FF8C42] pb-1">
              Operational Scope
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#142B4A] sm:text-4xl">
              Core Property Management Modules
            </p>
            <p className="mt-4 text-[#142B4A]/80 text-base leading-relaxed">
              Every workflow from initial tenant check-in to inventory maintenance is built to eliminate operational overhead and human error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Module 1 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Hierarchical Room Inventory</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Model real-world properties across Organization, Branch, Floor, Room, and Bed hierarchy. Track bed vacancies with status transitions (Vacant, Occupied, Maintenance).
              </p>
            </div>

            {/* Module 2 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Digital Tenant KYC</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Capture tenant profiles, verified government identification documents, emergency contact registries, and lease start dates without paper forms.
              </p>
            </div>

            {/* Module 3 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Rent Dues & Reconciliation</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Automate monthly billing cycles, calculate late penalty fees past grace periods, track partial payments, and issue cryptographically verifiable digital receipts.
              </p>
            </div>

            {/* Module 4 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Maintenance Work Orders</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Tenants file maintenance complaints with photos directly from the mobile app. Wardens and property staff receive assigned tickets with SLA tracking.
              </p>
            </div>

            {/* Module 5 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Role-Based Access Control</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Distinct operational privilege boundaries for Super Admins, Property Owners, Staff/Wardens, and Residents. Method-level security blocks privilege escalation.
              </p>
            </div>

            {/* Module 6 */}
            <div className="rounded-lg border border-[#142B4A]/20 bg-[#EAF6FF] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#142B4A] text-[#FF8C42] mb-5">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[#142B4A]">Comprehensive Audit Logs</h3>
              <p className="mt-3 text-sm text-[#142B4A]/80 leading-relaxed">
                Every critical database state change, bed re-allocation, rent adjustment, and login event is recorded with actor ID, timestamp, and IP address for full accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-20 bg-[#EAF6FF] border-b border-[#142B4A]/15 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-bold text-[#142B4A] uppercase tracking-wider inline-block border-b-2 border-[#FF8C42] pb-1">
              Zero-Trust Verification
            </h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#142B4A] sm:text-4xl">
              Security Architecture & Defensive Matrix
            </p>
            <p className="mt-4 text-[#142B4A]/80 text-base leading-relaxed">
              Engineered strictly against OWASP Top 10 vulnerabilities with defense-in-depth at network, application, and data persistence layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">Multi-Tenant Scoping</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                Prevents Insecure Direct Object References (IDOR/BOLA). Repositories strictly scope queries by organization ID tied to the authenticated identity.
              </p>
            </div>

            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Lock className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">BCrypt 12 & Lockout</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                Passwords hashed with work factor 12. Strict account lockout triggers after 5 failed authentication attempts to halt brute-force credential attacks.
              </p>
            </div>

            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Server className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">Bucket4j Rate Limiting</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                Multi-tier token bucket filters: 5 requests per minute on authentication endpoints and 60 requests per minute on general API routes with 429 status.
              </p>
            </div>

            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Smartphone className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">Hardware Keystore</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                Mobile tokens stored exclusively in Android Keystore / iOS Keychain via expo-secure-store. Prohibits vulnerable localStorage or plain AsyncStorage.
              </p>
            </div>

            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Database className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">SQL Injection Immunity</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                All data access uses parameterized JPA and Hibernate criteria queries. Database runs as non-root user in isolated Docker network bridge.
              </p>
            </div>

            <div className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-[#FF8C42]" />
                <h4 className="text-base font-semibold text-[#142B4A]">Strict Security Headers</h4>
              </div>
              <p className="text-xs text-[#142B4A]/80 leading-relaxed">
                Responses include HSTS (31536000s), Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production Domain Readiness */}
      <section className="py-16 bg-[#D5EBFC]/45 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center border border-[#142B4A]/20 bg-[#EAF6FF] p-10 rounded-xl">
          <h3 className="text-2xl font-bold text-[#142B4A]">Ready for Custom Domain Deployment</h3>
          <p className="mt-3 text-[#142B4A]/80 text-sm max-w-2xl mx-auto leading-relaxed">
            Configure your enterprise domain with reverse proxy routing, automated TLS certificate provisioning, and DNS propagation verification.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/domain-setup"
              className="btn-primary"
            >
              <span>Domain Configuration Checklist</span>
              <ArrowRight className="ml-2 h-4 w-4 text-[#142B4A]" />
            </Link>
            <Link
              to="/privacy-policy"
              className="btn-secondary"
            >
              <span>View Privacy Policy</span>
            </Link>
            <Link
              to="/terms-and-conditions"
              className="btn-secondary"
            >
              <span>View Terms of Service</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
