import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Banco de Questões de Medicina</h1>
      <p className="text-slate-700">
        Gerencie seu estudo com cadernos, simulados e revisão de erros. Faça login para
        acessar o dashboard e acompanhar seu progresso.
      </p>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
        >
          Ir para o dashboard
        </Link>
        <Link
          href="/(auth)/login"
          className="rounded border border-blue-600 px-4 py-2 text-blue-700 hover:bg-blue-50"
        >
          Fazer login
        </Link>
        <Link
          href="/(auth)/signup"
          className="rounded border border-green-600 px-4 py-2 text-green-700 hover:bg-green-50"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
