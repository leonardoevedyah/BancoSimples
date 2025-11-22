'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import QuestionCard from '../../components/QuestionCard';

export default function QuestionsPage() {
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '' });
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState(null);

  const pageSize = 10;

  const loadQuestions = async () => {
    let query = supabaseClient.from('questions').select('*').order('created_at', { ascending: false });
    if (filters.subject) query = query.ilike('subject', `%${filters.subject}%`);
    if (filters.topic) query = query.ilike('topic', `%${filters.topic}%`);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    const { data, error } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) {
      setMessage(error.message);
      return;
    }
    setQuestions(data || []);
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = (evt) => {
    setFilters({ ...filters, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    setPage(0);
    loadQuestions();
  };

  const registerAttempt = async (questionId) => {
    setMessage(null);
    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
      setMessage('Faça login para registrar tentativas.');
      return;
    }
    const userId = sessionData.session.user.id;
    await supabaseClient.from('question_attempts').insert({
      session_id: crypto.randomUUID(),
      user_id: userId,
      question_id: questionId,
      selected_option: null,
      is_correct: null,
    });
    setMessage('Tentativa registrada para revisão futura.');
  };

  const deleteQuestion = async (questionId) => {
    setMessage(null);
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) {
      setMessage('Erro ao verificar sessão.');
      return;
    }
    if (!sessionData.session) {
      setMessage('Faça login para remover questões.');
      return;
    }

    const { error } = await supabaseClient.from('questions').delete().eq('id', questionId);
    if (error) {
      setMessage(`Erro ao remover: ${error.message}`);
      return;
    }

    setMessage('Questão removida com sucesso.');
    setQuestions((prev) => prev.filter((item) => item.id !== questionId));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questões</h1>

      <form className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-700">
          Disciplina
          <input
            type="text"
            name="subject"
            value={filters.subject}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-700">
          Tópico
          <input
            type="text"
            name="topic"
            value={filters.topic}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-700">
          Dificuldade
          <select
            name="difficulty"
            value={filters.difficulty}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Todas</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Filtrar
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-blue-700">{message}</p>}

      <div className="space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <QuestionCard question={q} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => registerAttempt(q.id)}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Responder / Marcar para revisão
              </button>
              <button
                type="button"
                onClick={() => deleteQuestion(q.id)}
                className="rounded border border-red-600 px-4 py-2 text-red-700 hover:bg-red-50"
              >
                Deletar questão ruim
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPage(Math.max(0, page - 1))}
          className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
          disabled={page === 0}
        >
          Anterior
        </button>
        <span className="text-sm text-slate-600">Página {page + 1}</span>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
