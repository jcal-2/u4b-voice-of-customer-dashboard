import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'VoC Synthesis', path: '/' },
  { label: 'Master Feedback', path: '/feedback' },
  { label: 'Action Items', path: '/actions' },
  { label: 'Survey Framework', path: '/surveys' },
  { label: 'Customer Archetypes', path: '/archetypes' },
  { label: 'Raw Data', path: '/data' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-uber-black sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-lg text-uber-green">U4B</span>
          <span className="font-mono text-xs text-uber-ink-3">Voice of Customer</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`px-4 py-4 font-body text-sm transition-colors relative ${
                  isActive ? 'text-white' : 'text-uber-ink-3 hover:text-white'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-uber-green rounded-t" />
                )}
              </NavLink>
            );
          })}
        </div>
        {/* Mobile hamburger */}
        <div className="md:hidden">
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}

function MobileMenu() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-white p-2" aria-label="Menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 6l12 12M6 18L18 6" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-12 bg-uber-black border border-uber-gray-border rounded-lg w-56 py-2 shadow-lg">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 font-body text-sm ${
                location.pathname === tab.path ? 'text-uber-green' : 'text-uber-ink-3'
              }`}
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';
