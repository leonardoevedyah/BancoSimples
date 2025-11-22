'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

const promptExample = `Gere um arquivo JSON com um array chamado "questions".
Cada questão deve ter:
- subject: disciplina (ex.: Clinica Médica)
- topic: tópico (ex.: Pneumonia adquirida na comunidade)
- statement: enunciado completo
- options: array com 5 alternativas em texto
- correct_option: índice correto de 0 a 4
- explanation: comentário/gabarito
- difficulty: "facil", "medio" ou "dificil"

Formato final:
{
  "questions": [
    {
      "subject": "Disciplina",
      "topic": "Tópico",
      "statement": "Enunciado...",
      "options": ["A)", "B)", "C)", "D)", "E)"],
      "correct_option": 0,
      "explanation": "Explicação",
      "difficulty": "medio"
    }
  ]
}`;

const requiredFields = ['subject', 'topic', 'statement', 'options', 'correct_option'];

export default function ImportPage() {
  const [fileContent, setFileContent] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [manualQuestion, setManualQuestion] = useState({
    subject: '',
    topic: '',
    statement: '',
    options: '',
    correct_option: 0,
    explanation: '',
    difficulty: 'medio',
  });

  useEffect(() => {
    async function fetchUser() {
      const { data, error: sessionError } = await supabaseClient.auth.getUser();
      if (sessionError) return;
      setUserEmail(data?.user?.email || '');
    }
    fetchUser();
  }, []);

  function handleFileRead(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result || '');
    };
    reader.readAsText(file);
  }

  async function importQuestions(event) {
    event.preventDefault();
    setStatus('');
    setError('');
    setSuccess('');

    let parsed;
    try {
      parsed = JSON.parse(fileContent || '{}');
    } catch (err) {
      setError('Arquivo inválido: JSON não pôde ser lido.');
      return;
    }

    const questions = parsed.questions || [];
    if (!Array.isArray(questions) || questions.length === 0) {
      setError('Nenhuma questão encontrada. O JSON deve conter "questions": [ ... ].');
      return;
    }

    const cleaned = questions
      .filter((q) => requiredFields.every((field) => q[field] !== undefined))
      .map((q) => ({
        subject: q.subject,
        topic: q.topic,
        statement: q.statement,
        options: q.options,
        correct_option: Number(q.correct_option),
        explanation: q.explanation,
        difficulty: q.difficulty || 'medio',
      }));

    if (cleaned.length === 0) {
      setError('Nenhuma questão válida encontrada. Confira os campos obrigatórios.');
      return;
    }

    setStatus('Importando questões...');
    const { error: insertError, count } = await supabaseClient
      .from('questions')
      .insert(cleaned, { count: 'exact' });

    if (insertError) {
      setError(insertError.message);
      setStatus('');
      return;
    }

    setStatus('');
    setSuccess(`${count || cleaned.length} questões importadas com sucesso.`);
    setFileContent('');
  }

  async function saveManualQuestion(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setStatus('Salvando questão...');

    const options = manualQuestion.options
      .split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean);

    if (options.length !== 5) {
      setStatus('');
      setError('Inclua exatamente 5 alternativas, uma por linha.');
      return;
    }

    const payload = {
      subject: manualQuestion.subject,
      topic: manualQuestion.topic,
      statement: manualQuestion.statement,
      options,
      correct_option: Number(manualQuestion.correct_option),
      explanation: manualQuestion.explanation,
      difficulty: manualQuestion.difficulty,
    };

    const { error: insertError } = await supabaseClient.from('questions').insert(payload);

    if (insertError) {
      setError(insertError.message);
      setStatus('');
      return;
    }

    setStatus('');
    setSuccess('Questão cadastrada com sucesso.');
    setManualQuestion({
      subject: '',
      topic: '',
      statement: '',
      options: '',
      correct_option: 0,
      explanation: '',
      difficulty: 'medio',
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Importar questões</h1>
        <p className="text-slate-700">
          Faça login (ou crie conta) e utilize esta aba para cadastrar novas questões manualmente ou
          importar um lote gerado pelo ChatGPT. Usuário atual: {userEmail || 'não identificado'}
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Cadastro manual</h2>
          <form className="mt-4 space-y-3" onSubmit={saveManualQuestion}>
            <input
              value={manualQuestion.subject}
              onChange={(e) => setManualQuestion({ ...manualQuestion, subject: e.target.value })}
              placeholder="Disciplina"
              className="w-full rounded border px-3 py-2"
              required
            />
            <input
              value={manualQuestion.topic}
              onChange={(e) => setManualQuestion({ ...manualQuestion, topic: e.target.value })}
              placeholder="Tópico"
              className="w-full rounded border px-3 py-2"
              required
            />
            <textarea
              value={manualQuestion.statement}
              onChange={(e) => setManualQuestion({ ...manualQuestion, statement: e.target.value })}
              placeholder="Enunciado"
              className="w-full rounded border px-3 py-2"
              rows={4}
              required
            />
            <textarea
              value={manualQuestion.options}
              onChange={(e) => setManualQuestion({ ...manualQuestion, options: e.target.value })}
              placeholder={'Alternativas (5 linhas, uma por alternativa)'}
              className="w-full rounded border px-3 py-2"
              rows={5}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-700">
                Índice da correta (0 a 4)
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={manualQuestion.correct_option}
                  onChange={(e) =>
                    setManualQuestion({ ...manualQuestion, correct_option: e.target.value })
                  }
                  className="mt-1 w-full rounded border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm text-slate-700">
                Dificuldade
                <select
                  value={manualQuestion.difficulty}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, difficulty: e.target.value })}
                  className="mt-1 w-full rounded border px-3 py-2"
                >
                  <option value="facil">Fácil</option>
                  <option value="medio">Médio</option>
                  <option value="dificil">Difícil</option>
                </select>
              </label>
            </div>
            <textarea
              value={manualQuestion.explanation}
              onChange={(e) => setManualQuestion({ ...manualQuestion, explanation: e.target.value })}
              placeholder="Comentário/gabarito"
              className="w-full rounded border px-3 py-2"
              rows={3}
            />
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Salvar questão
            </button>
          </form>
        </div>

        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Importação em lote</h2>
          <p className="text-sm text-slate-700">
            Envie um arquivo JSON seguindo o formato abaixo. Você pode gerar o arquivo com o ChatGPT
            usando o prompt sugerido ao final da página.
          </p>
          <form className="mt-4 space-y-3" onSubmit={importQuestions}>
            <input type="file" accept="application/json" onChange={handleFileRead} />
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Cole aqui o JSON do arquivo, se preferir"
              className="w-full rounded border px-3 py-2"
              rows={10}
              required
            />
            <button
              type="submit"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Importar arquivo
            </button>
          </form>
        </div>
      </section>

      <section className="rounded border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-lg font-semibold text-amber-800">Prompt para o ChatGPT gerar o arquivo</h3>
        <p className="mt-2 text-sm text-amber-900">Cole o texto abaixo no ChatGPT para receber um JSON pronto para importação.</p>
        <pre className="mt-3 whitespace-pre-wrap rounded bg-white p-3 text-xs text-slate-800">
{promptExample}
        </pre>
      </section>

      {status && <p className="text-sm text-blue-700">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
    </div>
  );
}
