'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../lib/supabaseClient';

export default function NotebooksPage() {
  const [session, setSession] = useState(null);
  const [form, setForm] = useState({ title: '', subject: '', topic: '', difficulty: '', amount: 10 });
  const [message, setMessage] = useState(null);
  const [notebooks, setNotebooks] = useState([]);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
    };
    loadSession();
  }, []);

  useEffect(() => {
    if (!session) return;
    const loadNotebooks = async () => {
      const { data } = await supabaseClient
        .from('notebooks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setNotebooks(data || []);
    };
    loadNotebooks();
  }, [session]);

  const handleChange = (evt) => {
    setForm({ ...form, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setMessage(null);

    const userId = session?.user?.id;
    if (!userId) {
      setMessage('Faça login para criar cadernos.');
      return;
    }

    let query = supabaseClient.from('questions').select('*');
    if (form.subject) query = query.ilike('subject', `%${form.subject}%`);
    if (form.topic) query = query.ilike('topic', `%${form.topic}%`);
    if (form.difficulty) query = query.eq('difficulty', form.difficulty);
    const { data: questions } = await query.limit(Number(form.amount));

    const filters = {
      subject: form.subject,
      topic: form.topic,
      difficulty: form.difficulty,
    };

    const { data: notebook, error } = await supabaseClient
      .from('notebooks')
      .insert({ user_id: userId, title: form.title, filters })
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (notebook && questions?.length) {
      const notebookQuestions = questions.map((q, idx) => ({
        notebook_id: notebook.id,
        question_id: q.id,
        order_index: idx,
      }));
      await supabaseClient.from('notebook_questions').insert(notebookQuestions);
    }

    setMessage('Caderno criado com sucesso!');
    setForm({ title: '', subject: '', topic: '', difficulty: '', amount: 10 });
    const { data: reload } = await supabaseClient
      .from('notebooks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setNotebooks(reload || []);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cadernos</h1>
      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700">
            Título
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm text-slate-700">
            Quantidade de questões
            <input
              type="number"
              min="1"
              max="50"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Disciplina
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Tópico
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Dificuldade
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            >
              <option value="">Todas</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </label>
        </div>
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Criar caderno
        </button>
        {message && <p className="text-sm text-blue-700">{message}</p>}
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Meus cadernos</h2>
        <div className="mt-3 space-y-2">
          {notebooks.length === 0 && <p>Nenhum caderno criado.</p>}
          {notebooks.map((nb) => (
            <div key={nb.id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
              <div>
                <p className="font-semibold">{nb.title}</p>
                <p className="text-xs text-slate-600">
                  Criado em {new Date(nb.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Link href={`/notebooks/${nb.id}`} className="text-sm text-blue-700 underline">
                Abrir
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
