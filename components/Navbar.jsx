'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-blue-700">
          BancoSimples
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
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
      </nav>
    </header>
  );
}
