'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';
import QuestionCard from '../../components/QuestionCard';

export default function QuestionsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    subject: '',
    topic: '',
    difficulty: '',
    excludeRecent: '',
  });
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState(null);
  const [filteredCount, setFilteredCount] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [subjectTopicMap, setSubjectTopicMap] = useState({});
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [questionStats, setQuestionStats] = useState({});
  const [exporting, setExporting] = useState(false);

  const pageSize = 10;

  const loadFilterOptions = async () => {
    const { data, error } = await supabaseClient.from('questions').select('subject, topic');
    if (error) {
      setMessage('Erro ao carregar filtros disponíveis.');
      return;
    }
    const subjectMap = {};
    (data || []).forEach((row) => {
      if (row.subject && row.topic) {
        if (!subjectMap[row.subject]) subjectMap[row.subject] = new Set();
        subjectMap[row.subject].add(row.topic);
      }
    });

    const uniqueSubjects = Array.from(new Set((data || []).map((row) => row.subject).filter(Boolean))).sort();
    const uniqueTopics = Array.from(new Set((data || []).map((row) => row.topic).filter(Boolean))).sort();

    const normalizedMap = Object.fromEntries(
      Object.entries(subjectMap).map(([key, value]) => [key, Array.from(value).sort()]),
    );

    setSubjects(uniqueSubjects);
    setAllTopics(uniqueTopics);
    setTopics(uniqueTopics);
    setSubjectTopicMap(normalizedMap);
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

  const buildExclusionList = async () => {
    if (!session || !filters.excludeRecent) return [];

    const now = new Date();
    let since = new Date(now);
    if (filters.excludeRecent === '24h') {
      since.setHours(since.getHours() - 24);
    }
    if (filters.excludeRecent === '7d') {
      since.setDate(since.getDate() - 7);
    }

    const { data, error } = await supabaseClient
      .from('question_attempts')
      .select('question_id')
      .eq('user_id', session.user.id)
      .gte('created_at', since.toISOString());

    if (error) {
      setMessage('Erro ao aplicar filtro de recentes.');
      return [];
    }

    return Array.from(new Set((data || []).map((row) => row.question_id)));
  };

  const loadAttemptStats = async (questionsList) => {
    if (!session) return;
    const ids = questionsList.map((q) => q.id);
    if (ids.length === 0) {
      setQuestionStats({});
      return;
    }

    const { data, error } = await supabaseClient
      .from('question_attempts')
      .select('question_id, is_correct, created_at')
      .eq('user_id', session.user.id)
      .in('question_id', ids);

    if (error) {
      setMessage('Erro ao carregar histórico das questões.');
      return;
    }

    const statsMap = {};
    (data || []).forEach((attempt) => {
      const current = statsMap[attempt.question_id] || {
        total: 0,
        correct: 0,
        wrong: 0,
        lastAttempt: null,
      };
      current.total += 1;
      if (attempt.is_correct) current.correct += 1;
      else current.wrong += 1;
      if (!current.lastAttempt || new Date(attempt.created_at) > new Date(current.lastAttempt)) {
        current.lastAttempt = attempt.created_at;
      }
      statsMap[attempt.question_id] = current;
    });

    setQuestionStats(statsMap);
  };

  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return 'Nunca respondida';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Há ${days} dia(s)`;
    const weeks = Math.floor(days / 7);
    return `Há ${weeks} semana(s)`;
  };

  const buildQueryWithFilters = async () => {
    let query = supabaseClient
      .from('questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (filters.subject) query = query.ilike('subject', `%${filters.subject}%`);
    if (filters.topic) query = query.ilike('topic', `%${filters.topic}%`);
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);

    const excluded = await buildExclusionList();
    if (excluded.length) {
      query = query.not('id', 'in', `(${excluded.map((id) => `"${id}"`).join(',')})`);
    }
    return query;
  };

  const loadQuestions = async () => {
    setMessage(null);
    const query = await buildQueryWithFilters();
    const { data, error, count } = await query.range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) {
      setMessage(error.message || 'Erro ao carregar questões.');
      setQuestions([]);
      setFilteredCount(0);
      return;
    }
    const list = data || [];
    setFilteredCount(typeof count === 'number' ? count : list.length);
    setQuestions(list);
    if (!list.length) {
      setMessage('Nenhuma questão encontrada para os filtros selecionados.');
    }
    loadAttemptStats(list);
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
    const { name, value } = evt.target;
    if (name === 'subject') {
      const scopedTopics = value ? subjectTopicMap[value] || [] : allTopics;
      setTopics(scopedTopics);
      setFilters({ ...filters, subject: value, topic: '' });
      return;
    }
    setFilters({ ...filters, [name]: value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setPage(0);
    setAttempts({});
    await loadQuestions();
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

    const confirmationWord = 'deletar';
    const typed = window.prompt(`Digite "${confirmationWord}" para confirmar a exclusão da questão.`);
    if (typed !== confirmationWord) {
      setMessage('Captcha incorreto. Digite a palavra indicada para deletar.');
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

  const exportFilteredQuestions = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const query = await buildQueryWithFilters();
      const { data, error } = await query;
      if (error) {
        setMessage('Erro ao carregar questões para exportar.');
        setExporting(false);
        return;
      }
      const questionIds = (data || []).map((q) => q.id);
      if (!questionIds.length) {
        setMessage('Nenhuma questão para exportar.');
        setExporting(false);
        return;
      }
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_ids: questionIds, title: 'Questões filtradas' }),
      });
      let result = null;
      try {
        result = await response.json();
      } catch (err) {
        // ignore JSON parse errors so we can still surface a generic message
      }
      if (!response.ok) {
        setMessage(result?.error || 'Falha ao exportar PDF.');
      } else if (result?.url) {
        window.open(result.url, '_blank');
      }
    } catch (err) {
      setMessage('Erro inesperado ao exportar.');
    } finally {
      setExporting(false);
    }
  };

  const summary = () => {
    const answeredAttempts = Object.values(attempts).filter((item) => item?.checked);
    const answered = answeredAttempts.length;
    const correct = answeredAttempts.filter((item) => item.isCorrect).length;
    const wrong = answeredAttempts.filter((item) => !item.isCorrect).length;
    return { answered, correct, wrong };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Questões</h1>

      <form
        className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
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
        <label className="text-sm text-slate-700">
          Excluir tentadas
          <select
            name="excludeRecent"
            value={filters.excludeRecent}
            onChange={handleFilter}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            <option value="">Nenhum filtro</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Filtrar
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-blue-700">{message}</p>}

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <p className="text-sm font-medium text-slate-800">
          Total filtradas: {filteredCount || questions.length}
        </p>
        {(() => {
          const s = summary();
          return (
            <p className="text-sm text-slate-700">
              Progresso: respondeu {s.answered} de {filteredCount || questions.length} · Acertos: {s.correct} · Erros: {s.wrong}
            </p>
          );
        })()}
        <button
          type="button"
          onClick={exportFilteredQuestions}
          disabled={exporting}
          className="inline-flex w-full items-center justify-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
        >
          {exporting ? 'Exportando...' : 'Exportar PDF (questões filtradas)'}
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q) => {
          const attempt = attempts[q.id] || {};
          const stats = questionStats[q.id] || { total: 0, correct: 0, wrong: 0, lastAttempt: null };
          return (
            <div
              key={q.id}
              className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="text-xs text-slate-600">
                Tentativas: {stats.total} · Acertos: {stats.correct} · Erros: {stats.wrong} · Última vez:{' '}
                {formatTimeAgo(stats.lastAttempt)}
              </div>
              <QuestionCard
                question={q}
                onSelect={(idx) => handleSelectOption(q.id, idx)}
                selectedOption={attempt.selected}
                showAnswer={attempt.checked}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => confirmAttempt(q)}
                  className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 sm:w-auto"
                >
                  Confirmar resposta
                </button>
                <button
                  type="button"
                  onClick={() => deleteQuestion(q.id)}
                  className="w-full rounded border border-red-600 px-4 py-2 text-red-700 hover:bg-red-50 sm:w-auto"
                >
                  Deletar questão
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
