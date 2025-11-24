export default function QuestionCard({ question, onSelect, selectedOption, showAnswer }) {
  if (!question) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-medium text-slate-900">{question.statement}</p>
      <div className="mt-3 space-y-2">
        {question.options?.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = question.correct_option === idx;
          const optionStyle =
            showAnswer && isCorrect
              ? 'border-green-500 bg-green-50'
              : isSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white';
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect && onSelect(idx)}
              className={`flex w-full items-start gap-2 rounded border px-3 py-2 text-left text-sm ${optionStyle}`}
            >
              <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {showAnswer && question.explanation && (
        <div className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold">Comentário:</p>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
