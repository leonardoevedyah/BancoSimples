'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '../../components/Card';
import Stats from '../../components/Stats';
import { supabaseClient } from '../../lib/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0 });
  const [recentNotebooks, setRecentNotebooks] = useState([]);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setSession(data.session);
    };
    loadSession();
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const fetchStats = async () => {
      const userId = session.user.id;
      const { data: attempts } = await supabaseClient
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', userId);

      const total = attempts?.length || 0;
      const correct = attempts?.filter((a) => a.is_correct)?.length || 0;
      const wrong = total - correct;
      setStats({ total, correct, wrong });

      const { data: notebooks } = await supabaseClient
        .from('notebooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentNotebooks(notebooks || []);
    };

    fetchStats();
  }, [session]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Stats
        items={[
          { label: 'Questões respondidas', value: stats.total },
          { label: 'Acertos', value: stats.correct },
          { label: 'Erros', value: stats.wrong },
        ]}
      />

      <Card
        title="Últimos cadernos"
        actions={
          <Link href="/notebooks" className="text-sm text-blue-700 underline">
            Ver todos
          </Link>
        }
      >
        {recentNotebooks.length === 0 && <p>Nenhum caderno criado ainda.</p>}
        <ul className="space-y-2">
          {recentNotebooks.map((nb) => (
            <li key={nb.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{nb.title}</p>
                <p className="text-xs text-slate-600">
                  Criado em {new Date(nb.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <Link href={`/notebooks/${nb.id}`} className="text-sm text-blue-700 underline">
                Abrir
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
