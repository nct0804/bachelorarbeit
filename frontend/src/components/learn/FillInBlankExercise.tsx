import { useState } from "react"

export interface FillInBlankExerciseProps {
  prefix: string
  suffix: string
  onSelect: (text: string) => void
  instruction?: string
  onEnter?: () => void
}

export function FillInBlankExercise({
  prefix,
  suffix,
  onSelect,
  instruction,
  onEnter,
}: FillInBlankExerciseProps) {
  const [inputValue, setInputValue] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    onSelect(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && onEnter) {
      onEnter();
    }
  }

  return (
    <div className="flex flex-col space-y-8 w-full max-w-lg" data-test="exercise-fill-blank">
      <h2 className="text-3xl font-bold text-center block mb-20" data-test="exercise-instruction">{instruction}</h2>
      <div className="flex justify-center items-center space-x-3" data-test="exercise-fill-blank-row">
        <div className="text-2xl" data-test="exercise-fill-blank-prefix">{prefix}</div>
        <input
          type="text"
          data-test="exercise-fill-blank-input"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="inline-block w-32 border-b-2 border-[#fbb124] 
          text-center text-2xl bg-transparent focus:outline-none focus:border-[#408297]"
        />
        <div className="text-2xl" data-test="exercise-fill-blank-suffix">{suffix}</div>
      </div>
    </div>
  );
}
