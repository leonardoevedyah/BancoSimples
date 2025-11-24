'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (evt) => {
    setForm({ ...form, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ type: 'success', text: 'Login realizado!' });
    setTimeout(() => router.push('/dashboard'), 600);
  };

  return (
    <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold">Login</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          E-mail
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Senha
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-700'}`}
        >
          {message.text}
        </p>
      )}
      <p className="mt-4 text-sm text-slate-600">
        Não tem conta?{' '}
        <Link href="/signup" className="text-blue-700 underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
