import { Button } from "@/components/ui/button"

interface LearningFooterProps {
    handleCheck: () => void
    selected: boolean
    checking?: boolean
    exerciseType?: string
}

export default function LearningFooter( { handleCheck, selected, checking = false, exerciseType }: LearningFooterProps) {
    const isVocabCheck = exerciseType === "VOCABULARY_CHECK";
    return (
        <div className="w-full flex justify-end items-center px-50 py-10 mt-auto" data-test="learn-footer">
            <Button
                data-test="learn-check-button"
                className="h-12 bg-gradient-to-r 
                from-[#fbb124] to-[#ffa600] 
                hover:from-[#ffa600] hover:to-[#ffa600] text-white 
                font-semibold rounded-xl shadow-lg hover:shadow-xl transition 
                transform hover:scale-[1.02] focus:scale-[0.98] text-xl"
                onClick={handleCheck}
                disabled={!selected || checking}
            >
                {isVocabCheck ? "Continue" : "Check"}
            </Button>
        </div>
    )
}
