import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  Bell,
  Diamond,
} from 'lucide-react';

export const HireByteNavbar: React.FC = () => {
  const [activeNav, setActiveNav] = useState('Hiring Management');

  const navItems = [
    { label: 'Overview', hasDropdown: false },
    { label: 'Hiring Management', hasDropdown: true },
    { label: 'Employees', hasDropdown: true },
    { label: 'Payroll', hasDropdown: false },
    { label: 'Reports', hasDropdown: false },
  ];

  return (
    <nav className="hb-navbar">
      <div className="hb-navbar-inner">
        {/* Logo */}
        <div className="hb-logo">
          <div className="hb-logo-icon">
            <Diamond size={20} strokeWidth={2.5} />
          </div>
          <span className="hb-logo-text">INTERVIA</span>
        </div>

        {/* Navigation Links */}
        <div className="hb-nav-links">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`hb-nav-link ${activeNav === item.label ? 'hb-nav-link-active' : ''}`}
              onClick={() => setActiveNav(item.label)}
            >
              <span>{item.label}</span>
              {item.hasDropdown && <ChevronDown size={14} className="hb-nav-chevron" />}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="hb-nav-right">
          <div className="hb-search-box">
            <Search size={16} className="hb-search-icon" />
            <span className="hb-search-text">Search</span>
          </div>
          <button className="hb-notif-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="hb-notif-badge">99+</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
