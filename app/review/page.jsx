'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';
import QuestionCard from '../../components/QuestionCard';

export default function ReviewPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);

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
      const { data } = await supabaseClient
        .from('question_attempts')
        .select('*, question:question_id(*)')
        .eq('user_id', session.user.id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(50);
      setAttempts(data || []);
    };
    loadAttempts();
  }, [session]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Revisão de erros</h1>
      {attempts.length === 0 && <p>Nenhum erro para revisar.</p>}
      <div className="space-y-4">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <QuestionCard question={attempt.question} showAnswer selectedOption={attempt.selected_option} />
            <p className="text-sm text-slate-700">
              Você marcou: {attempt.selected_option != null ? String.fromCharCode(65 + attempt.selected_option) : '—'} | Correta:{' '}
              {String.fromCharCode(65 + attempt.question.correct_option)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
