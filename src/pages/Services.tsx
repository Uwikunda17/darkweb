import React from 'react';
import { GlitchText } from '../components/TorLoading';
import { Shield, Zap, DollarSign, UserX, Globe, Ghost, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const services = [
  {
    id: 'hitman',
    title: 'BESPOKE SOLUTIONS',
    icon: UserX,
    description: 'Professional conflict resolution. Global reach. Discrete execution.',
    price: 'From 5.5 BTC',
    status: 'ONLINE',
    warning: 'SCAM ALERT: Many competitors are feds. We are the only verified group.'
  },
  {
    id: 'ddos',
    title: 'STORM-STRESSER',
    icon: Zap,
    description: 'L7/L4 DDoS attacks. Bypass Cloudflare, Akamai, and Google Shield.',
    price: '0.05 BTC / Hour',
    status: 'ONLINE',
    warning: 'Do not use on government infrastructure.'
  },
  {
    id: 'laundry',
    title: 'BIT-WASH',
    icon: DollarSign,
    description: 'Premium coin mixing service. Break the chain. 100% untraceable.',
    price: '2% Fee',
    status: 'ONLINE',
    warning: 'Minimum deposit: 0.1 BTC'
  },
  {
    id: 'hacking',
    title: 'VOID_HACKERS',
    icon: Globe,
    description: 'Corporate espionage, database extraction, and social engineering.',
    price: 'Custom Quote',
    status: 'MAINTENANCE',
    warning: 'Current backlog: 14 days.'
  },
  {
    id: 'hosting',
    title: 'BULLETPROOF_HOSTING',
    icon: Shield,
    description: 'Offshore servers in non-extradition jurisdictions. No logs. No DMCA.',
    price: '0.02 BTC / Month',
    status: 'ONLINE',
    warning: 'Accepts all content except CP.'
  },
  {
    id: 'ghost',
    title: 'GHOST_IDENTITY',
    icon: Ghost,
    description: 'New identity package: Passport, SSN, Birth Certificate, Driving License.',
    price: '1.2 BTC',
    status: 'ONLINE',
    warning: 'Physical delivery only. No digital copies.'
  }
];

const Services: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="space-y-4 text-center">
        <GlitchText text="PREMIUM SERVICES" className="text-4xl font-black text-[#8b0000]" />
        <p className="text-[#00ff9d]/50 text-xs uppercase tracking-[0.3em]">Verified Underground Solutions</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative border border-[#00ff9d]/10 bg-[#0d0d0d] p-6 rounded-sm hover:border-[#8b0000]/50 transition-all duration-500 overflow-hidden"
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-5 group-hover:opacity-10 transition-opacity"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#8b0000]/10 rounded-sm group-hover:bg-[#8b0000]/20 transition-colors">
                  <service.icon className="w-6 h-6 text-[#8b0000]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                    service.status === 'ONLINE' ? 'text-[#00ff9d] border-[#00ff9d]/30 bg-[#00ff9d]/5' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5'
                  }`}>
                    {service.status}
                  </span>
                  <span className="text-[10px] text-[#00ff9d] font-mono mt-2">{service.price}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-black text-white group-hover:text-[#8b0000] transition-colors tracking-widest">{service.title}</h3>
                <p className="text-xs text-[#00ff9d]/60 leading-relaxed">{service.description}</p>
              </div>

              <div className="pt-4 border-t border-[#00ff9d]/5 space-y-4">
                <div className="flex items-start gap-2 p-2 bg-black/40 border border-yellow-500/10 rounded-sm">
                  <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-yellow-500/70 italic leading-tight">{service.warning}</p>
                </div>

                <button className="w-full py-3 bg-transparent border border-[#8b0000]/30 text-[#8b0000] text-[10px] font-bold uppercase tracking-widest hover:bg-[#8b0000] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                  <span>INITIATE CONTRACT</span>
                  <Zap className="w-3 h-3 group-hover/btn:animate-pulse" />
                </button>
              </div>
            </div>

            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
              <div className="absolute top-0 right-0 w-full h-[1px] bg-[#8b0000]/20 group-hover:bg-[#8b0000]/50 transition-colors"></div>
              <div className="absolute top-0 right-0 h-full w-[1px] bg-[#8b0000]/20 group-hover:bg-[#8b0000]/50 transition-colors"></div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="border border-[#8b0000]/20 bg-[#8b0000]/5 p-8 rounded-sm text-center space-y-4">
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-[#8b0000]" />
        </div>
        <h3 className="text-xl font-black text-white tracking-widest">ESCROW PROTECTION</h3>
        <p className="text-xs text-[#00ff9d]/60 max-w-2xl mx-auto leading-relaxed">
          All services listed here are covered by ShadowNet Escrow. Funds are only released upon successful completion of the contract. 
          If you are scammed, open a dispute in the <span className="text-[#8b0000] font-bold">Admin Terminal</span>.
        </p>
        <div className="flex justify-center gap-8 pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00ff9d]" />
            <span className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Verified Vendors</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00ff9d]" />
            <span className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">Multi-Sig Support</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#00ff9d]" />
            <span className="text-[10px] text-[#00ff9d]/50 uppercase tracking-widest">24/7 Support</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
