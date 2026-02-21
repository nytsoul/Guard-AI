import { Shield } from 'lucide-react';
import { Link } from 'react-router';

interface FooterProps {
  variant?: 'landing' | 'app';
}

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#' },
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  security: [
    { label: 'Trust Center', href: '#' },
    { label: 'SOC2 Compliance', href: '#' },
    { label: 'HIPAA', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Status', href: '#' },
  ],
};

export function Footer({ variant = 'landing' }: FooterProps) {
  if (variant === 'app') {
    return (
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-8 py-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="size-3.5 text-blue-600" />
            <span>Sentinel Shield © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Documentation</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">API Keys</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Trust Center</a>
            <a href="#" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Status</a>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 bg-green-500 rounded-full" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </footer>
    );
  }

  // Landing page footer
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pt-16 pb-8 px-6">
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Shield className="size-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">Sentinel Shield</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enterprise-grade LLM security middleware. Protecting AI infrastructure worldwide.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} Sentinel Shield. All rights reserved. SECURE_PROXY_AUTH_V2 / ENCRYPTION_AES_256
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-600">
            <Link to="/login" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
              Sign In
            </Link>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">GitHub</a>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-slate-400 transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
