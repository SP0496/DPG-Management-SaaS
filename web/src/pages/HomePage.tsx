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
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative border-b border-slate-800 bg-slate-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1 text-xs font-medium text-slate-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Zero-Trust Enterprise Property Management Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Paying Guest and Hostel Property Management System
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Centralize branch operations, room allocation, monthly rent dues, and tenant onboarding in one unified platform. Engineered with strict multi-tenant row-level data isolation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors"
            >
              <span>Explore Operational Modules</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>

            <Link
              to="/domain-setup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span>Custom Domain Setup Guide</span>
            </Link>
          </div>

          <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="border-l-2 border-slate-700 pl-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Architecture</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">Spring Boot 3.3 REST</div>
            </div>
            <div className="border-l-2 border-slate-700 pl-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mobile Client</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">React Native (Expo 52)</div>
            </div>
            <div className="border-l-2 border-slate-700 pl-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Data Storage</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">PostgreSQL 16 Multi-Tenant</div>
            </div>
            <div className="border-l-2 border-slate-700 pl-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Security</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">BCrypt 12 & Rate Limiting</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Operational Modules Section */}
      <section id="features" className="py-20 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Operational Scope
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Core Property Management Modules
            </p>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Every workflow from initial tenant check-in to inventory maintenance is built to eliminate operational overhead and human error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Module 1 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Hierarchical Room Inventory</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Model real-world properties across Organization, Branch, Floor, Room, and Bed hierarchy. Track bed vacancies with status transitions (Vacant, Occupied, Maintenance).
              </p>
            </div>

            {/* Module 2 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Digital Tenant KYC</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Capture tenant profiles, verified government identification documents, emergency contact registries, and lease start dates without paper forms.
              </p>
            </div>

            {/* Module 3 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Rent Dues & Reconciliation</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Automate monthly billing cycles, calculate late penalty fees past grace periods, track partial payments, and issue cryptographically verifiable digital receipts.
              </p>
            </div>

            {/* Module 4 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Maintenance Work Orders</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Tenants file maintenance complaints with photos directly from the mobile app. Wardens and property staff receive assigned tickets with SLA tracking.
              </p>
            </div>

            {/* Module 5 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Role-Based Access Control</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Distinct operational privilege boundaries for Super Admins, Property Owners, Staff/Wardens, and Residents. Method-level security blocks privilege escalation.
              </p>
            </div>

            {/* Module 6 */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-blue-400 border border-slate-800 mb-5">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Comprehensive Audit Logs</h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Every critical database state change, bed re-allocation, rent adjustment, and login event is recorded with actor ID, timestamp, and IP address for full accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section id="security" className="py-20 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mb-16">
            <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Zero-Trust Verification
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Security Architecture & Defensive Matrix
            </p>
            <p className="mt-4 text-slate-300 text-base leading-relaxed">
              Engineered strictly against OWASP Top 10 vulnerabilities with defense-in-depth at network, application, and data persistence layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Multi-Tenant Scoping</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents Insecure Direct Object References (IDOR/BOLA). Repositories strictly scope queries by organization ID tied to the authenticated identity.
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Lock className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">BCrypt 12 & Lockout</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passwords hashed with work factor 12. Strict account lockout triggers after 5 failed authentication attempts to halt brute-force credential attacks.
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Server className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Bucket4j Rate Limiting</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-tier token bucket filters: 5 requests per minute on authentication endpoints and 60 requests per minute on general API routes with 429 status.
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Hardware Keystore</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile tokens stored exclusively in Android Keystore / iOS Keychain via expo-secure-store. Prohibits vulnerable localStorage or plain AsyncStorage.
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Database className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">SQL Injection Immunity</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All data access uses parameterized JPA and Hibernate criteria queries. Database runs as non-root user in isolated Docker network bridge.
              </p>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Strict Security Headers</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Responses include HSTS (31536000s), Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Production Domain Readiness */}
      <section className="py-16 bg-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center border border-slate-800 bg-slate-950 p-10 rounded-xl">
          <h3 className="text-2xl font-bold text-white">Ready for Custom Domain Deployment</h3>
          <p className="mt-3 text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Configure your enterprise domain with reverse proxy routing, automated TLS certificate provisioning, and DNS propagation verification.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/domain-setup"
              className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <span>Domain Configuration Checklist</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/privacy-policy"
              className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span>View Privacy Policy</span>
            </Link>
            <Link
              to="/terms-and-conditions"
              className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span>View Terms of Service</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
