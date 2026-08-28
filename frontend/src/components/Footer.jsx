import React from 'react';
import { Bus, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-sky-950/50 py-8 text-slate-400 mt-auto shadow-[0_-12px_30px_-8px_rgba(56,189,248,0.15)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center md:items-start text-center md:text-left">
          
          {/* Logo & Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start">
              <Bus className="h-6 w-6 text-sky-400" />
              <span className="ml-2 text-lg font-black text-white tracking-tight">
                Transit<span className="text-sky-400">X</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto md:mx-0">
              Smart Transit Portal for Parul University Goa Campus. Providing safe, optimized, and live tracking shuttle coordinates for college buses.
            </p>
          </div>

          {/* Contact Directory */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Transport Directory</h4>
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-3.5 w-3.5 text-sky-400" />
                <span>Manager: <a href="tel:+919213001447" className="hover:text-white transition-colors">+91 9213001447</a></span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-3.5 w-3.5 text-sky-400" />
                <span>Assistant Manager: <a href="tel:+918605320843" className="hover:text-white transition-colors">+91 8605320843</a></span>
              </div>
            </div>
          </div>

          {/* Location & Copyright */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Campus Location</h4>
            <div className="flex items-start justify-center md:justify-start gap-2 text-xs">
              <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span className="text-slate-500">Parul University Goa Campus, Ponda Taluka, Goa, India</span>
            </div>
            <div className="text-[10px] text-slate-600 font-bold border-t border-slate-900 pt-3 mt-4">
              &copy; {new Date().getFullYear()} TransitX. All Rights Reserved.
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
