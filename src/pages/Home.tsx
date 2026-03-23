import React from 'react';
import { GlitchText } from '../components/TorLoading';
import { ExternalLink, Shield, Lock, Terminal, ShoppingCart, MessageSquare, Users, AlertTriangle, Info } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: any) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: "Financial Services",
      links: [
        { name: "Bitcoin Laundry", desc: "Clean your dirty coins with 0.5% fee.", status: "Online" },
        { name: "Counterfeit USD", desc: "High quality $20 and $50 notes.", status: "Online" },
        { name: "Stolen CC Shop", desc: "Fresh logs from US/EU banks.", status: "Offline" },
      ]
    },
    {
      title: "Commercial Services",
      links: [
        { name: "Shadow Market", desc: "The biggest marketplace on the net.", action: () => onNavigate('market'), status: "Online" },
        { name: "Fake ID Central", desc: "Passports, DLs, and ID cards.", status: "Online" },
        { name: "Hacker for Hire", desc: "Professional penetration testing.", status: "Online" },
      ]
    },
    {
      title: "Communication",
      links: [
        { name: "Encrypted Chat", desc: "Secure messaging for vendors.", action: () => onNavigate('chat'), status: "Online" },
        { name: "Shadow Forums", desc: "Discuss anything anonymously.", action: () => onNavigate('forums'), status: "Online" },
        { name: "Onion Mail", desc: "Free anonymous email service.", status: "Offline" },
      ]
    },
    {
      title: "Information & Education",
      links: [
        { name: "Training Dashboard", desc: "Gamified cybersecurity training modules.", action: () => onNavigate('dashboard'), status: "Online" },
        { name: "Tor Library", desc: "Banned books and documents.", status: "Online" },
        { name: "Safety Guide", desc: "How to stay safe on the dark web.", action: () => onNavigate('disclaimer'), status: "Online" },
      ]
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <section className="text-center space-y-4">
        <GlitchText text="THE HIDDEN WIKI" className="text-4xl font-black text-[#00ff9d] tracking-widest" />
        <p className="text-[#00ff9d]/60 max-w-2xl mx-auto font-mono text-sm leading-relaxed">
          Welcome to the ShadowNet directory. This is the primary gateway to the hidden services of the deep web. 
          Use these links at your own risk. We are not responsible for any data loss or legal consequences.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, i) => (
          <div key={i} className="border border-[#00ff9d]/10 bg-[#0d0d0d] p-6 rounded-sm hover:border-[#00ff9d]/30 transition-all group">
            <h3 className="text-[#8b0000] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              {cat.title}
            </h3>
            <ul className="space-y-4">
              {cat.links.map((link, j) => (
                <li key={j} className="group/link">
                  <button 
                    onClick={link.action}
                    disabled={!link.action}
                    className={`w-full text-left flex justify-between items-start gap-4 p-3 rounded-sm transition-colors ${
                      link.action ? 'hover:bg-[#00ff9d]/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${link.action ? 'text-[#00ff9d]' : 'text-[#00ff9d]/50'}`}>
                        {link.name}
                      </p>
                      <p className="text-[10px] text-[#00ff9d]/40 mt-1">{link.desc}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase font-bold border ${
                        link.status === 'Online' ? 'text-[#00ff9d] border-[#00ff9d]/30 bg-[#00ff9d]/5' : 'text-[#8b0000] border-[#8b0000]/30 bg-[#8b0000]/5'
                      }`}>
                        {link.status}
                      </span>
                      {link.action && <ExternalLink className="w-3 h-3 text-[#00ff9d]/30 group-hover/link:text-[#00ff9d]" />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="bg-[#8b0000]/5 border border-[#8b0000]/20 p-8 rounded-sm">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-[#8b0000] shrink-0" />
          <div className="space-y-2">
            <h4 className="text-[#8b0000] font-bold uppercase tracking-widest">Security Warning</h4>
            <p className="text-xs text-[#00ff9d]/70 leading-relaxed">
              Never share your real identity. Use a VPN in combination with Tor. Disable JavaScript if possible. 
              Beware of phishing sites that look like this one. If the URL doesn't end in .onion, it's a scam.
              ShadowNet uses end-to-end encryption for all communications.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
