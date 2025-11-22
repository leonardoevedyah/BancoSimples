'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';
import QuestionCard from '../../components/QuestionCard';

export default function QuestionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '' });
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState({});

  const pageSize = 10;

  const loadFilterOptions = async () => {
    const { data, error } = await supabaseClient.from('questions').select('subject, topic');
    if (error) {
      setMessage('Erro ao carregar filtros disponíveis.');
      return;
    }
    const uniqueSubjects = Array.from(
      new Set((data || []).map((row) => row.subject).filter(Boolean)),
    ).sort();
    const uniqueTopics = Array.from(new Set((data || []).map((row) => row.topic).filter(Boolean))).sort();
    setSubjects(uniqueSubjects);
    setTopics(uniqueTopics);
  };

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
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (!session) return;
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, session]);

  const handleFilter = (evt) => {
    setFilters({ ...filters, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    setPage(0);
    loadQuestions();
  };

  const confirmAttempt = async (question) => {
    setMessage(null);
    if (!session) {
      setMessage('Faça login para responder.');
      return;
    }

    const selection = attempts[question.id]?.selected;
    if (selection == null) {
      setMessage('Escolha uma alternativa antes de confirmar.');
      return;
    }

    const isCorrect = selection === question.correct_option;
    await supabaseClient.from('question_attempts').insert({
      session_id: crypto.randomUUID(),
      user_id: session.user.id,
      question_id: question.id,
      selected_option: selection,
      is_correct: isCorrect,
    });

    setAttempts((prev) => ({
      ...prev,
      [question.id]: { selected: selection, checked: true, isCorrect },
    }));
    setMessage(isCorrect ? 'Acertou! Gabarito exibido.' : 'Você errou. Confira o gabarito.');
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAttempts((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selected: optionIndex },
    }));
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

      <form
        className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4"
        onSubmit={handleSubmit}
      >
        <label className="text-sm text-slate-700">
          Disciplina
          <select
            name="subject"
            value={filters.subject}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Todas</option>
            {subjects.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Tópico
          <select
            name="topic"
            value={filters.topic}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Todos</option>
            {topics.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
        {questions.map((q) => {
          const attempt = attempts[q.id] || {};
          return (
            <div key={q.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <QuestionCard
                question={q}
                onSelect={(idx) => handleSelectOption(q.id, idx)}
                selectedOption={attempt.selected}
                showAnswer={attempt.checked}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => confirmAttempt(q)}
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Confirmar resposta
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="rounded border border-red-600 px-4 py-2 text-red-700 hover:bg-red-50"
                >
                  Deletar questão ruim
                </button>
                {attempt.checked && (
                  <span
                    className={`rounded px-3 py-2 text-sm ${
                      attempt.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {attempt.isCorrect ? 'Acertou' : 'Errou'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
