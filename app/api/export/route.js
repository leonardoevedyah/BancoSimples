import { NextResponse } from 'next/server';

// Exportação em PDF desativada temporariamente para restaurar a estabilidade
// do deploy enquanto as novas implementações são refeitas em outro branch.
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { error: 'Exportação em PDF temporariamente desativada para manutenção.' },
    { status: 503 },
  );
}
