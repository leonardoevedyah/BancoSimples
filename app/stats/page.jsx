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
      const { data, error } = await supabaseClient
        .from('questions')
        .select('id, subject, topic');

      if (error) {
        setMessage('Erro ao carregar estatísticas.');
        return;
      }

      const subjectMap = {};
      const topicMap = {};

      (data || []).forEach((row) => {
        const subjectKey = row.subject || 'Sem disciplina definida';
        const topicKey = `${row.subject || 'Sem disciplina'}|${row.topic || 'Sem tópico'}`;

        subjectMap[subjectKey] = (subjectMap[subjectKey] || 0) + 1;
        topicMap[topicKey] = {
          subject: row.subject,
          topic: row.topic,
          count: (topicMap[topicKey]?.count || 0) + 1,
        };
      });

      const subjectsData = Object.entries(subjectMap)
        .map(([subject, count]) => ({ subject: subject === 'Sem disciplina definida' ? null : subject, count }))
        .sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));

      const topicsData = Object.values(topicMap).sort((a, b) => {
        const subjCompare = (a.subject || '').localeCompare(b.subject || '');
        if (subjCompare !== 0) return subjCompare;
        return (a.topic || '').localeCompare(b.topic || '');
      });

      setSubjectCounts(subjectsData);
      setTopicCounts(topicsData);
    };

    loadCounts();
  }, [session]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold leading-tight">Estatísticas de Questões</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        Veja quantas questões existem por disciplina e por tópico, com base nos registros atuais do banco.
      </p>
      {message && <p className="text-sm text-blue-700">{message}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Por disciplina</h2>
          <div className="divide-y divide-slate-200">
            {(subjectCounts || []).map((row) => (
              <div
                key={row.subject || 'sem-disciplina'}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="text-slate-700">{row.subject || 'Sem disciplina definida'}</span>
                <span className="rounded bg-slate-50 px-2 py-1 font-semibold text-slate-900">{row.count}</span>
              </div>
            ))}
            {!subjectCounts.length && <p className="py-2 text-sm text-slate-600">Nenhuma disciplina cadastrada.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Por tópico</h2>
          <div className="divide-y divide-slate-200">
            {(topicCounts || []).map((row) => (
              <div
                key={`${row.subject || 'sem-disciplina'}-${row.topic || 'sem-topico'}`}
                className="flex flex-col gap-1 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {row.subject || 'Sem disciplina'} · {row.topic || 'Sem tópico'}
                  </span>
                  <span className="rounded bg-slate-50 px-2 py-1 font-semibold text-slate-900">{row.count}</span>
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
