'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

export default function StatsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState(null);
  const [subjectCounts, setSubjectCounts] = useState([]);
  const [topicCounts, setTopicCounts] = useState([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      setSession(data.session);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const loadCounts = async () => {
      setMessage(null);
      const { data: subjectsData, error: subjectsError } = await supabaseClient
        .from('questions')
        .select('subject, count:id')
        .group('subject')
        .order('subject', { ascending: true });

      const { data: topicsData, error: topicsError } = await supabaseClient
        .from('questions')
        .select('subject, topic, count:id')
        .group('subject, topic')
        .order('subject', { ascending: true })
        .order('topic', { ascending: true });

      if (subjectsError || topicsError) {
        setMessage('Erro ao carregar estatísticas.');
        return;
      }

      setSubjectCounts(subjectsData || []);
      setTopicCounts(topicsData || []);
    };

    loadCounts();
  }, [session]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Estatísticas de Questões</h1>
      <p className="text-sm text-slate-600">
        Veja quantas questões existem por disciplina e por tópico, com base nos registros atuais do banco.
      </p>
      {message && <p className="text-sm text-blue-700">{message}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Por disciplina</h2>
          <div className="divide-y divide-slate-200">
            {(subjectCounts || []).map((row) => (
              <div key={row.subject || 'sem-disciplina'} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{row.subject || 'Sem disciplina definida'}</span>
                <span className="font-semibold text-slate-900">{row.count}</span>
              </div>
            ))}
            {!subjectCounts.length && <p className="py-2 text-sm text-slate-600">Nenhuma disciplina cadastrada.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Por tópico</h2>
          <div className="divide-y divide-slate-200">
            {(topicCounts || []).map((row) => (
              <div key={`${row.subject || 'sem-disciplina'}-${row.topic || 'sem-topico'}`} className="flex flex-col gap-1 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">
                    {row.subject || 'Sem disciplina'} · {row.topic || 'Sem tópico'}
                  </span>
                  <span className="font-semibold text-slate-900">{row.count}</span>
                </div>
              </div>
            ))}
            {!topicCounts.length && <p className="py-2 text-sm text-slate-600">Nenhum tópico cadastrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
