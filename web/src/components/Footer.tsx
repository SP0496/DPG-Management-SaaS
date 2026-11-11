import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2.5 text-white mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-base font-bold tracking-tight">PG Management SaaS</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standardized, multi-tenant property management infrastructure for PG chains, hostels, and co-living operators.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Platform Modules
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="/#features" className="hover:text-slate-200 transition-colors">Multi-Branch Inventory</a></li>
              <li><a href="/#features" className="hover:text-slate-200 transition-colors">Digital Tenant KYC</a></li>
              <li><a href="/#features" className="hover:text-slate-200 transition-colors">Automated Rent Dues</a></li>
              <li><a href="/#features" className="hover:text-slate-200 transition-colors">Maintenance Work Orders</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Compliance & Security
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/privacy-policy" className="hover:text-slate-200 transition-colors flex items-center space-x-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-slate-200 transition-colors flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>Terms and Conditions</span>
                </Link>
              </li>
              <li>
                <a href="/#security" className="hover:text-slate-200 transition-colors flex items-center space-x-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-500" />
                  <span>Security Audit Matrix</span>
                </a>
              </li>
              <li>
                <Link to="/domain-setup" className="hover:text-slate-200 transition-colors flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Custom Domain Setup</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              System Specifications
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p>Backend: Spring Boot 3.3 (Java 17/21)</p>
              <p>Database: PostgreSQL 16 (Row-Level Tenancy)</p>
              <p>Mobile: React Native (Expo 52)</p>
              <p>Auth: Stateless HMAC-SHA512 JWT</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} PG Management SaaS. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link to="/domain-setup" className="hover:text-slate-300 transition-colors">Domain Configuration</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
