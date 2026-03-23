import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const OnlineUsersCounter: React.FC = () => {
  const [count, setCount] = useState(1423);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(1000, prev + change);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#8b0000]/10 border border-[#8b0000]/30 rounded-full">
      <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-pulse shadow-[0_0_5px_#00ff9d]"></div>
      <Users className="w-3 h-3 text-[#8b0000]" />
      <span className="text-[9px] font-mono text-[#00ff9d] tracking-widest">{count.toLocaleString()} ONLINE</span>
    </div>
  );
};

export default OnlineUsersCounter;
