
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-center text-emerald-400 tracking-wider">
          Pakistan News Summary
        </h1>
        <p className="text-center text-slate-400 mt-1">
          AI-Powered Insights into Current Affairs
        </p>
      </div>
    </header>
  );
};

export default Header;
