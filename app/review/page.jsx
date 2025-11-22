'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';
import QuestionCard from '../../components/QuestionCard';

export default function ReviewPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [groupedAttempts, setGroupedAttempts] = useState([]);

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
    const loadAttempts = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: attemptRows, error: attemptsError } = await supabaseClient
        .from('question_attempts')
        .select('id, question_id, selected_option, is_correct, created_at')
        .eq('user_id', session.user.id)
        .eq('is_correct', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50);

      if (attemptsError) {
        console.error('Erro ao carregar revisões', attemptsError.message);
        setAttempts([]);
        setGroupedAttempts([]);
        return;
      }

      const ids = Array.from(new Set((attemptRows || []).map((row) => row.question_id)));
      let questionsMap = {};
      if (ids.length) {
        const { data: questionsData, error: questionsError } = await supabaseClient
          .from('questions')
          .select('id, subject, topic, statement, options, correct_option, explanation')
          .in('id', ids);

        if (questionsError) {
          console.error('Erro ao carregar questões para revisão', questionsError.message);
        } else {
          questionsMap = (questionsData || []).reduce((acc, q) => {
            acc[q.id] = q;
            return acc;
          }, {});
        }
      }

      const attemptsWithQuestions = (attemptRows || []).map((attempt) => ({
        ...attempt,
        question: questionsMap[attempt.question_id] || null,
      }));

      setAttempts(attemptsWithQuestions);
      const grouped = attemptsWithQuestions.reduce((acc, attempt) => {
        const subject = attempt.question?.subject || 'Sem disciplina';
        const topic = attempt.question?.topic || 'Sem tópico';
        const key = `${subject}||${topic}`;
        if (!acc[key]) {
          acc[key] = { subject, topic, items: [] };
        }
        acc[key].items.push(attempt);
        return acc;
      }, {});
      setGroupedAttempts(Object.values(grouped));
    };
    loadAttempts();
  }, [session]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Revisão de erros (últimas 24h)</h1>
      {attempts.length === 0 && <p>Nenhum erro para revisar nas últimas 24 horas.</p>}
      <div className="space-y-6">
        {groupedAttempts.map((group) => (
          <div key={`${group.subject}-${group.topic}`} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800">{group.subject}</span>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-700">{group.topic}</span>
            </div>
            <div className="space-y-4">
              {group.items.map((attempt) => (
                <div key={attempt.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <QuestionCard question={attempt.question} showAnswer selectedOption={attempt.selected_option} />
                  <p className="text-sm text-slate-700">
                    Você marcou: {attempt.selected_option != null ? String.fromCharCode(65 + attempt.selected_option) : '—'} | Correta:{' '}
                    {String.fromCharCode(65 + attempt.question.correct_option)}
                  </p>
                  <p className="text-xs text-slate-500">Tentada em {new Date(attempt.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
