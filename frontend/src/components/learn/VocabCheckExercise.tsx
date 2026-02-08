import type { ExerciseOption } from "@/hooks/useLessonExercises"

export interface VocabCheckExerciseProps {
  question: string
  instruction: string
  items: ExerciseOption[]
  selected: number | null
  onSelect: (id: number) => void
}

export function VocabCheckExercise({
  question,
  instruction,
  items,
  selected,
  onSelect,
}: VocabCheckExerciseProps) {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-lg">
      <h2 className="text-3xl font-semibold text-center">{question}</h2>
      <p className="text-center text-sm text-gray-600">{instruction}</p>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={
              `flex flex-col items-center p-4 rounded-lg border transition ` +
              (selected === item.id
                ? "border-primary bg-primary/10"
                : "border-gray-200 bg-white")
            }
            onClick={() => onSelect(item.id)}
          >
            <img src={item.imageSrc || ""} alt={item.text} className="w-16 h-16 mb-2" />
            <span className="text-lg">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}