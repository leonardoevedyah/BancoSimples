'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabaseClient } from '../../../lib/supabaseClient';
import QuestionCard from '../../../components/QuestionCard';

export default function NotebookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [notebook, setNotebook] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState(null);

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
    const loadNotebook = async () => {
      if (!params?.id) return;
      const { data: nb, error } = await supabaseClient
        .from('notebooks')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error) {
        setMessage(error.message);
        return;
      }
      setNotebook(nb);
      const { data: notebookQuestions } = await supabaseClient
        .from('notebook_questions')
        .select('order_index, question:question_id(*)')
        .eq('notebook_id', params.id)
        .order('order_index', { ascending: true });
      setQuestions((notebookQuestions || []).map((item) => item.question));
    };
    loadNotebook();
  }, [params]);

  const handleSelect = (optionIndex) => {
    const currentQuestion = questions[currentIndex];
    setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
  };

  const saveCurrentAttempt = async () => {
    const userId = session?.user?.id;
    const question = questions[currentIndex];
    if (!userId || !question) return null;
    const selectedOption = answers[question.id];
    const isCorrect = selectedOption === question.correct_option;
    await supabaseClient.from('question_attempts').insert({
      session_id: params.id,
      user_id: userId,
      question_id: question.id,
      selected_option: selectedOption,
      is_correct: isCorrect,
    });
    return isCorrect;
  };

  const confirmCurrent = async () => {
    setMessage(null);
    const question = questions[currentIndex];
    if (!question) return;

    const selected = answers[question.id];
    if (selected == null) {
      setMessage('Selecione uma alternativa para confirmar.');
      return;
    }

    const isCorrect = await saveCurrentAttempt();
    setChecked((prev) => ({ ...prev, [question.id]: { checked: true, isCorrect } }));
    setMessage(isCorrect ? 'Acertou! Gabarito liberado.' : 'Você errou. Veja o gabarito.');
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    if (!checked[currentQuestion.id]?.checked) {
      setMessage('Confirme a resposta antes de avançar.');
      return;
    }

    if (currentIndex < questions.length - 1) {
      setMessage(null);
      setCurrentIndex(currentIndex + 1);
    } else {
      finalizeSession();
    }
  };

  const finalizeSession = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) correct += 1;
    });
    const wrong = questions.length - correct;
    await supabaseClient.from('sessions').insert({
      id: params.id,
      user_id: userId,
      notebook_id: params.id,
      total_questions: questions.length,
      correct_count: correct,
      wrong_count: wrong,
      finished_at: new Date().toISOString(),
    });
    setFinished(true);
    setMessage('Sessão finalizada!');
  };

  if (!notebook) {
    return <p>Carregando caderno...</p>;
  }

  const currentQuestion = questions[currentIndex];
  const currentCheck = currentQuestion ? checked[currentQuestion.id] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{notebook.title}</h1>
          <p className="text-sm text-slate-600">Questão {currentIndex + 1} de {questions.length}</p>
        </div>
        {finished && <p className="text-green-700">Sessão concluída</p>}
      </div>

      {currentQuestion ? (
        <QuestionCard
          question={currentQuestion}
          onSelect={handleSelect}
          selectedOption={answers[currentQuestion.id]}
          showAnswer={finished || currentCheck?.checked}
        />
      ) : (
        <p>Nenhuma questão encontrada.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirmCurrent}
          className="rounded border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
          disabled={finished}
        >
          Confirmar resposta
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          className="rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
          disabled={currentIndex === 0}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded bg-blue-600 px-4 py-2 text-white"
          disabled={finished}
        >
          {currentIndex === questions.length - 1 ? 'Finalizar' : 'Próxima'}
        </button>
        {currentCheck?.checked && (
          <span
            className={`rounded px-3 py-2 text-sm ${
              currentCheck.isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {currentCheck.isCorrect ? 'Acertou' : 'Errou'}
          </span>
        )}
      </div>

      {message && <p className="text-sm text-blue-700">{message}</p>}
    </div>
  );
}
