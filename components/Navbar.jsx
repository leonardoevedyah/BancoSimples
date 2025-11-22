'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/questions', label: 'Questões' },
  { href: '/notebooks', label: 'Cadernos' },
  { href: '/review', label: 'Revisão' },
  { href: '/import', label: 'Importar' },
  { href: '/stats', label: 'Estatísticas' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-lg font-semibold text-blue-700">
            BancoSimples
          </Link>
          <button
            type="button"
            className="rounded border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((prev) => !prev)}
          >
            ☰
          </button>
          <div className="hidden items-center gap-3 text-sm font-medium text-slate-700 md:flex">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${active ? 'text-blue-700 underline' : 'hover:text-blue-600'}`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/signup"
              className="rounded border border-blue-600 px-3 py-1 text-blue-700 hover:bg-blue-50"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
          </div>
        </div>

        {open && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 md:hidden">
            {links.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${active ? 'text-blue-700 underline' : 'hover:text-blue-600'}`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2">
              <Link
                href="/signup"
                className="rounded border border-blue-600 px-3 py-2 text-center text-blue-700 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Criar conta
              </Link>
              <Link
                href="/login"
                className="rounded border border-slate-300 px-3 py-2 text-center text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
