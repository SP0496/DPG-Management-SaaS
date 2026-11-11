import React from 'react';
import { Globe, CheckCircle2, ArrowLeft, Terminal, Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DomainSetupGuidePage: React.FC = () => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span>Return to Platform Home</span>
      </Link>

      <div className="border-b border-slate-800 pb-8 mb-10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600/10 text-blue-400 border border-blue-500/20">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Custom Domain Setup Guide</h1>
            <p className="text-xs text-slate-400 mt-1">Production Domain Mapping & Automated SSL Provisioning</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Follow this 4-step checklist to bind your custom business domain (e.g., <code className="text-blue-400 bg-slate-900 px-1.5 py-0.5 rounded">app.yourpgcompany.com</code>) to the PG-Management-SaaS infrastructure.
        </p>
      </div>

      <div className="space-y-10 text-slate-300 text-sm leading-relaxed">
        {/* Step 1 */}
        <section className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white font-semibold text-base mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">1</span>
            <h3>Configure DNS Records at Your Domain Registrar</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Navigate to your DNS provider (Cloudflare, GoDaddy, AWS Route 53, Namecheap) and add the following records:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800">
              <thead className="bg-slate-950 text-slate-300 font-semibold">
                <tr>
                  <th className="p-3 border-b border-slate-800">Type</th>
                  <th className="p-3 border-b border-slate-800">Host / Name</th>
                  <th className="p-3 border-b border-slate-800">Value / Target</th>
                  <th className="p-3 border-b border-slate-800">TTL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                <tr>
                  <td className="p-3 text-blue-400">A</td>
                  <td className="p-3">@ (or app)</td>
                  <td className="p-3">YOUR_SERVER_STATIC_IPV4</td>
                  <td className="p-3 text-slate-500">Auto (300s)</td>
                </tr>
                <tr>
                  <td className="p-3 text-blue-400">CNAME</td>
                  <td className="p-3">portal</td>
                  <td className="p-3">app.yourpgcompany.com</td>
                  <td className="p-3 text-slate-500">Auto (300s)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Step 2 */}
        <section className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white font-semibold text-base mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">2</span>
            <h3>Update Environment CORS Allowed Origins</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Add your domain to the Spring Boot backend environment configuration in <code className="text-slate-200">backend/.env</code> so requests from your domain pass CORS checks:
          </p>
          <div className="bg-slate-950 p-4 rounded-md border border-slate-800 font-mono text-xs text-slate-300">
            CORS_ALLOWED_ORIGINS=https://app.yourpgcompany.com,https://yourpgcompany.com
          </div>
        </section>

        {/* Step 3 */}
        <section className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white font-semibold text-base mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">3</span>
            <h3>Nginx Reverse Proxy & SSL Configuration</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            The infrastructure includes a pre-configured template at <code className="text-slate-200">infra/nginx/nginx.conf</code>. Generate a free trusted TLS certificate with Let&apos;s Encrypt:
          </p>
          <div className="bg-slate-950 p-4 rounded-md border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-slate-500"># Install certbot on your server:</div>
            <div>sudo apt install certbot python3-certbot-nginx</div>
            <div className="text-slate-500"># Obtain and install TLS certificate:</div>
            <div>sudo certbot --nginx -d app.yourpgcompany.com</div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="border border-slate-800 bg-slate-900/40 p-6 rounded-lg">
          <div className="flex items-center space-x-2 text-white font-semibold text-base mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">4</span>
            <h3>Launch Verification Checklist</h3>
          </div>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>DNS A Record resolves to static server IPv4</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>HTTPS enforced with HSTS header (max-age=31536000)</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Favicon (<code className="text-blue-400">/favicon.svg</code>) loads with 200 OK</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Privacy Policy (<code className="text-blue-400">/privacy-policy</code>) and Terms (<code className="text-blue-400">/terms-and-conditions</code>) linked in footer</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span>Zero &apos;Made with AI&apos; or generator tags present in page source</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
