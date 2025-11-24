'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../lib/supabaseClient';

const COUPON_CODE = 'CONVIDADO';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', coupon: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (evt) => {
    setForm({ ...form, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setMessage(null);

    if (form.coupon !== COUPON_CODE) {
      setMessage({ type: 'error', text: 'Cupom inválido.' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabaseClient.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }

    if (data?.user) {
      await supabaseClient.from('users_profiles').upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.name,
      });
    }

    setLoading(false);
    setMessage({ type: 'success', text: 'Conta criada! Faça login.' });
    setTimeout(() => router.push('/login'), 800);
  };

  return (
    <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold">Criar conta</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Nome
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
            required
          />
        </label>
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
        <label className="block text-sm font-medium text-slate-700">
          Cupom
          <input
            type="text"
            name="coupon"
            value={form.coupon}
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
          {loading ? 'Criando...' : 'Criar conta'}
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
        Já tem conta?{' '}
        <Link href="/login" className="text-blue-700 underline">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
