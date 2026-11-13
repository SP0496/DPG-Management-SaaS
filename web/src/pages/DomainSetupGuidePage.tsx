import React from 'react';
import { Globe, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DomainSetupGuidePage: React.FC = () => {
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
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#142B4A] tracking-tight">Custom Domain Setup Guide</h1>
              <p className="text-xs text-[#142B4A]/70 mt-1 font-medium">
                Production Domain Mapping & Automated SSL Provisioning
              </p>
            </div>
          </div>
          <p className="text-[#142B4A]/85 text-sm leading-relaxed">
            Follow this 4-step checklist to bind your custom business domain (e.g.,{' '}
            <code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1.5 py-0.5 rounded font-mono text-xs">
              app.yourpgcompany.com
            </code>
            ) to the PG-Management-SaaS infrastructure.
          </p>
        </div>

        <div className="space-y-10 text-[#142B4A]/90 text-sm leading-relaxed">
          {/* Step 1 */}
          <section className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
            <div className="flex items-center space-x-3 text-[#142B4A] font-semibold text-base mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8C42] text-xs font-bold text-[#142B4A]">
                1
              </span>
              <h3>Configure DNS Records at Your Domain Registrar</h3>
            </div>
            <p className="text-xs text-[#142B4A]/80 mb-4">
              Navigate to your DNS provider (Cloudflare, GoDaddy, AWS Route 53, Namecheap) and add the following records:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#142B4A]/20">
                <thead className="bg-[#142B4A] text-[#EAF6FF] font-semibold">
                  <tr>
                    <th className="p-3 border-b border-[#1D3D63]">Type</th>
                    <th className="p-3 border-b border-[#1D3D63]">Host / Name</th>
                    <th className="p-3 border-b border-[#1D3D63]">Value / Target</th>
                    <th className="p-3 border-b border-[#1D3D63]">TTL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#142B4A]/15 font-mono text-[#142B4A] bg-[#EAF6FF]">
                  <tr>
                    <td className="p-3 font-bold text-[#142B4A]">A</td>
                    <td className="p-3">@ (or app)</td>
                    <td className="p-3">YOUR_SERVER_STATIC_IPV4</td>
                    <td className="p-3 text-[#142B4A]/70">Auto (300s)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-[#142B4A]">CNAME</td>
                    <td className="p-3">portal</td>
                    <td className="p-3">app.yourpgcompany.com</td>
                    <td className="p-3 text-[#142B4A]/70">Auto (300s)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Step 2 */}
          <section className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
            <div className="flex items-center space-x-3 text-[#142B4A] font-semibold text-base mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8C42] text-xs font-bold text-[#142B4A]">
                2
              </span>
              <h3>Update Environment CORS Allowed Origins</h3>
            </div>
            <p className="text-xs text-[#142B4A]/80 mb-4">
              Add your domain to the Spring Boot backend environment configuration in{' '}
              <code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1 py-0.5 rounded">backend/.env</code> so requests from your domain pass CORS checks:
            </p>
            <div className="bg-[#142B4A] p-4 rounded-md border border-[#1D3D63] font-mono text-xs text-[#EAF6FF]">
              CORS_ALLOWED_ORIGINS=https://app.yourpgcompany.com,https://yourpgcompany.com
            </div>
          </section>

          {/* Step 3 */}
          <section className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
            <div className="flex items-center space-x-3 text-[#142B4A] font-semibold text-base mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8C42] text-xs font-bold text-[#142B4A]">
                3
              </span>
              <h3>Nginx Reverse Proxy & SSL Configuration</h3>
            </div>
            <p className="text-xs text-[#142B4A]/80 mb-4">
              The infrastructure includes a pre-configured template at{' '}
              <code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1 py-0.5 rounded">infra/nginx/nginx.conf</code>. Generate a free trusted TLS certificate with Let&apos;s Encrypt:
            </p>
            <div className="bg-[#142B4A] p-4 rounded-md border border-[#1D3D63] font-mono text-xs text-[#EAF6FF] space-y-2">
              <div className="text-[#FF8C42]"># Install certbot on your server:</div>
              <div>sudo apt install certbot python3-certbot-nginx</div>
              <div className="text-[#FF8C42]"># Obtain and install TLS certificate:</div>
              <div>sudo certbot --nginx -d app.yourpgcompany.com</div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="border border-[#142B4A]/20 bg-[#F4FAFF] p-6 rounded-lg">
            <div className="flex items-center space-x-3 text-[#142B4A] font-semibold text-base mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF8C42] text-xs font-bold text-[#142B4A]">
                4
              </span>
              <h3>Launch Verification Checklist</h3>
            </div>
            <ul className="space-y-3 text-xs text-[#142B4A]/90">
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />
                <span>DNS A Record resolves to static server IPv4</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />
                <span>HTTPS enforced with HSTS header (max-age=31536000)</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />
                <span>
                  Favicon (<code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1 py-0.5 rounded">/favicon.svg</code>) loads with 200 OK
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />
                <span>
                  Privacy Policy (<code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1 py-0.5 rounded">/privacy-policy</code>) and Terms (<code className="text-[#142B4A] font-semibold bg-[#D5EBFC] px-1 py-0.5 rounded">/terms-and-conditions</code>) linked in footer
                </span>
              </li>
              <li className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#FF8C42] flex-shrink-0" />
                <span>Zero &apos;Made with AI&apos; or generator tags present in page source</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
