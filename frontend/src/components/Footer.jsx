import React from 'react';
import { Bus, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#09090b] border-t border-yellow-500/20 py-10 text-zinc-400 mt-auto shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center md:items-start text-center md:text-left">
          
          {/* Logo & Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start">
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Bus className="h-4.5 w-4.5 text-yellow-400" />
              </div>
              <span className="ml-2.5 text-lg font-black text-white tracking-tight">
                Transit<span className="text-yellow-400">X</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto md:mx-0 leading-relaxed">
              Smart Transit Portal for Parul University Goa Campus (Quitol). Providing safe, optimized, and live tracking shuttle coordinates for college buses across Goa.
            </p>
          </div>

          {/* Contact Directory */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-yellow-400 uppercase tracking-widest">Transport Directory</h4>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-3.5 w-3.5 text-yellow-400" />
                <span>Manager: <a href="tel:+919213001447" className="text-zinc-300 hover:text-yellow-400 transition-colors">+91 9213001447</a></span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="h-3.5 w-3.5 text-yellow-400" />
                <span>Assistant Manager: <a href="tel:+918605320843" className="text-zinc-300 hover:text-yellow-400 transition-colors">+91 8605320843</a></span>
              </div>
            </div>
          </div>

          {/* Location & Copyright */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-yellow-400 uppercase tracking-widest">Campus Location</h4>
            <div className="flex items-start justify-center md:justify-start gap-2 text-xs">
              <MapPin className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
              <span className="text-zinc-400">Parul University Goa Campus, Near ONGC Betul, Quitol, South Goa, India</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-bold border-t border-zinc-800/80 pt-3 mt-4">
              &copy; {new Date().getFullYear()} TransitX. Engineered with Cyber Yellow Precision.
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
