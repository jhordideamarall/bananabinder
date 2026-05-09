"use client";

import Link from "next/link";
import { IconShoppingBag, IconUser, IconMenu2, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@bananasbindery/ui";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full glass shadow-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
              <span className="bg-accent rounded-full p-1">🍌</span>
              <span className="hidden sm:block">Bananasbindery</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">Katalog</Link>
            <Link href="/custom" className="text-sm font-medium hover:text-primary transition-colors">Custom Order</Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">Tentang Kami</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 hover:bg-black/5 rounded-full transition-colors">
              <IconShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-secondary text-[10px] text-white w-4 h-4 flex items-center justify-center rounded-full">0</span>
            </Link>
            <Link href="/auth" className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <IconUser className="w-5 h-5" />
            </Link>
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass border-t border-white/20 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/products" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-black/5">Katalog</Link>
            <Link href="/custom" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-black/5">Custom Order</Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-black/5">Tentang Kami</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
