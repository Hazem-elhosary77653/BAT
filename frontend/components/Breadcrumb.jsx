'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-gray-600 hover:text-primary transition"
      >
        <Home size={16} />
        <span>Dashboard</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-gray-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-600 hover:text-primary transition"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
