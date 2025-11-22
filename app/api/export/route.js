import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const body = await request.json();
  const notebookId = body?.notebook_id;
  if (!notebookId) {
    return NextResponse.json({ error: 'notebook_id é obrigatório' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Variáveis do Supabase ausentes' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: notebook, error: notebookError } = await supabase
    .from('notebooks')
    .select('title')
    .eq('id', notebookId)
    .single();
  if (notebookError) {
    return NextResponse.json({ error: notebookError.message }, { status: 400 });
  }

  const { data: questions, error: questionsError } = await supabase
    .from('notebook_questions')
    .select('order_index, question:question_id(statement, options, correct_option)')
    .eq('notebook_id', notebookId)
    .order('order_index', { ascending: true });

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 400 });
  }

  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  doc.fontSize(18).text(notebook.title || 'Caderno', { align: 'center' });
  doc.moveDown();

  questions.forEach((item, idx) => {
    const question = item.question;
    doc.fontSize(12).text(`${idx + 1}. ${question.statement}`);
    question.options.forEach((opt, optIdx) => {
      doc.text(`   ${String.fromCharCode(65 + optIdx)}) ${opt}`);
    });
    doc.moveDown();
  });

  doc.addPage();
  doc.fontSize(14).text('Gabarito', { underline: true });
  doc.moveDown();
  questions.forEach((item, idx) => {
    const correct = String.fromCharCode(65 + item.question.correct_option);
    doc.text(`${idx + 1}. ${correct}`);
  });

  doc.end();

  const pdfBuffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  const filePath = `exports/notebook-${notebookId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('exports')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from('exports').getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl?.publicUrl });
}
