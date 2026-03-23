import React from 'react';
import { Shield, Lock, Terminal, AlertTriangle, Info, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { GlitchText } from '../components/TorLoading';

interface DisclaimerProps {
  onBack: () => void;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-700">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[#00ff9d]/50 hover:text-[#00ff9d] transition-colors uppercase text-[10px] font-bold tracking-widest"
      >
        <ChevronLeft className="w-4 h-4" />
        Return to Portal
      </button>

      <section className="text-center space-y-4">
        <GlitchText text="SAFETY & LEGAL DISCLAIMER" className="text-3xl font-black text-[#8b0000]" />
        <p className="text-[#00ff9d]/60 font-mono text-sm leading-relaxed">
          ShadowNet is a simulated environment created for educational and entertainment purposes. 
          No actual illegal activities, transactions, or communications occur within this portal.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-8">
        <div className="border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-6">
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-[#00ff9d]" />
            <h3 className="text-lg font-bold text-[#00ff9d] uppercase tracking-widest">Educational Purpose</h3>
          </div>
          <p className="text-xs text-[#00ff9d]/70 leading-relaxed">
            This application is designed to demonstrate the user interface, mechanics, and aesthetic of the deep web's hidden services. 
            It aims to educate users about the risks associated with anonymous networks, including exit scams, phishing, and malware.
          </p>
        </div>

        <div className="border border-[#8b0000]/20 bg-[#8b0000]/5 p-8 rounded-sm space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#8b0000]" />
            <h3 className="text-lg font-bold text-[#8b0000] uppercase tracking-widest">How to Stay Safe</h3>
          </div>
          <ul className="space-y-4">
            {[
              { title: "Use Tor Correctlty", desc: "Always use the official Tor Browser. Never maximize the window as it can reveal your screen resolution." },
              { title: "VPN + Tor", desc: "While controversial, a trusted VPN can hide your Tor usage from your ISP, but it adds another point of failure." },
              { title: "JavaScript", desc: "Disable JavaScript in your browser settings. Many exploits rely on JS to deanonymize users." },
              { title: "OPSEC", desc: "Never use your real name, email, or any handle that can be linked to your clear-web identity." },
              { title: "PGP Encryption", desc: "Always encrypt sensitive messages with PGP. Never trust a site's built-in 'encryption' alone." }
            ].map((item, i) => (
              <li key={i} className="space-y-1">
                <p className="text-xs font-bold text-[#00ff9d] uppercase tracking-widest">{item.title}</p>
                <p className="text-[10px] text-[#00ff9d]/50 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-[#00ff9d]/10 bg-[#0d0d0d] p-8 rounded-sm space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[#8b0000]" />
            <h3 className="text-lg font-bold text-[#8b0000] uppercase tracking-widest">Legal Notice</h3>
          </div>
          <p className="text-xs text-[#00ff9d]/70 leading-relaxed italic">
            "The information provided here is for informational purposes only. Accessing certain hidden services may be illegal in your jurisdiction. 
            We do not condone or encourage any illegal acts. By using this simulator, you agree that you are doing so for learning purposes only."
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <div className="flex items-center gap-2 text-[10px] text-[#00ff9d]/30 uppercase tracking-[0.5em]">
          <Lock className="w-3 h-3" />
          ShadowNet Security Protocol v4.2
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
