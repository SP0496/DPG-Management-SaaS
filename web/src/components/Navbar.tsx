import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, ShieldCheck, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1D3D63] bg-[#142B4A] text-[#EAF6FF]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-3 text-[#EAF6FF] hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#FF8C42] text-[#142B4A]">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#EAF6FF]">PG Management SaaS</span>
            <span className="text-xs text-[#EAF6FF]/75 font-medium">Enterprise Property Suite</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a
            href="/#features"
            className="py-1 text-[#EAF6FF]/90 hover:text-[#FF8C42] transition-colors"
          >
            Core Modules
          </a>
          <a
            href="/#security"
            className="flex items-center space-x-1.5 py-1 text-[#EAF6FF]/90 hover:text-[#FF8C42] transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-[#FF8C42]" />
            <span>Security Architecture</span>
          </a>
          <Link
            to="/domain-setup"
            className={`flex items-center space-x-1.5 py-1 transition-colors ${
              isActive('/domain-setup')
                ? 'border-b-2 border-[#FF8C42] text-[#FF8C42]'
                : 'text-[#EAF6FF]/90 hover:text-[#FF8C42]'
            }`}
          >
            <Globe className="h-4 w-4 text-[#FF8C42]" />
            <span>Custom Domain</span>
          </Link>
          <Link
            to="/privacy-policy"
            className={`py-1 transition-colors ${
              isActive('/privacy-policy')
                ? 'border-b-2 border-[#FF8C42] text-[#FF8C42]'
                : 'text-[#EAF6FF]/90 hover:text-[#FF8C42]'
            }`}
          >
            Privacy
          </Link>
          <Link
            to="/terms-and-conditions"
            className={`py-1 transition-colors ${
              isActive('/terms-and-conditions')
                ? 'border-b-2 border-[#FF8C42] text-[#FF8C42]'
                : 'text-[#EAF6FF]/90 hover:text-[#FF8C42]'
            }`}
          >
            Terms
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <a
            href="http://localhost:8080/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center rounded-md border border-[#EAF6FF]/30 bg-[#1D3D63] px-3.5 py-1.5 text-xs font-semibold text-[#EAF6FF] hover:border-[#FF8C42] hover:text-[#FF8C42] transition-colors"
          >
            System Status
          </a>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-md bg-[#FF8C42] px-4 py-2 text-sm font-semibold text-[#142B4A] hover:bg-[#E8752E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8C42] transition-colors"
          >
            Admin Sign In
          </Link>
        </div>
      </div>
    </header>
  );
};
