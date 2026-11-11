import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, Globe } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-3 text-slate-100 hover:text-white transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight">PG Management SaaS</span>
            <span className="text-xs text-slate-400 font-medium">Enterprise Property Suite</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="/#features" className="hover:text-white transition-colors">
            Core Modules
          </a>
          <a href="/#security" className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Security Architecture</span>
          </a>
          <Link to="/domain-setup" className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Globe className="h-4 w-4 text-slate-400" />
            <span>Custom Domain</span>
          </Link>
          <Link to="/privacy-policy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
            Terms
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <a
            href="http://localhost:8080/api/v1/health"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            System Status
          </a>
          <a
            href="#admin-login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            Admin Sign In
          </a>
        </div>
      </div>
    </header>
  );
};
