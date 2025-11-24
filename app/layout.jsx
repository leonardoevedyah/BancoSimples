import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Banco de Questões Medicina',
  description: 'Estudo e simulados com Supabase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
