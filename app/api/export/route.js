import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const body = await request.json();
  const notebookId = body?.notebook_id;
  const questionIds = body?.question_ids;
  const customTitle = body?.title;
  if (!notebookId && !questionIds) {
    return NextResponse.json({ error: 'É preciso fornecer notebook_id ou question_ids' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Variáveis do Supabase ausentes' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let questions = [];
  let title = customTitle || 'Export';

  if (notebookId) {
    const { data: notebook, error: notebookError } = await supabase
      .from('notebooks')
      .select('title')
      .eq('id', notebookId)
      .single();
    if (notebookError) {
      return NextResponse.json({ error: notebookError.message }, { status: 400 });
    }
    title = notebook?.title || 'Caderno';

    const { data: notebookQuestions, error: notebookQuestionsError } = await supabase
      .from('notebook_questions')
      .select('order_index, question:question_id(statement, options, correct_option, explanation)')
      .eq('notebook_id', notebookId)
      .order('order_index', { ascending: true });

    if (notebookQuestionsError) {
      return NextResponse.json({ error: notebookQuestionsError.message }, { status: 400 });
    }
    questions = notebookQuestions;
  } else if (questionIds?.length) {
    const { data: fetched, error: fetchError } = await supabase
      .from('questions')
      .select('id, statement, options, correct_option, explanation')
      .in('id', questionIds);
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }
    questions = (fetched || []).map((q, idx) => ({ order_index: idx, question: q }));
  }

  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  doc.fontSize(18).text(title, { align: 'center' });
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
  doc.fontSize(14).text('Gabarito e comentários', { underline: true });
  doc.moveDown();
  questions.forEach((item, idx) => {
    const correct = String.fromCharCode(65 + item.question.correct_option);
    const explanation = item.question.explanation || 'Sem comentário';
    doc.text(`${idx + 1}. ${correct} - ${explanation}`);
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
