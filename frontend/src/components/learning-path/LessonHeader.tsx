import { LockIcon } from "lucide-react";

export default function LessonHeader({
    title,
    description,
    setSelectedLesson,
    isLocked,
    order
}: {
    id: number,
    title: string, 
    description: string | undefined,
    setSelectedLesson: (lesson: number | null) => void,
    isLocked: boolean,
    order: number
}) {
    return (
        <> 
            <div className={` 
            text-white font-bold rounded-2xl px-8 py-8 
            w-full flex items-center 
            sticky top-0 z-30 shadow-lg
            ${isLocked ? 'bg-[#b6b6b6]' : 'bg-[#256996]'}`}
            data-test={`lesson-header-${order}`}
            >
                {/* Left arrow icon */}
                {!isLocked ? (
                    <button
                        className="mr-4 flex items-center"
                        onClick={() => setSelectedLesson(null)}
                        data-test={`lesson-header-back-${order}`}
                        style={{ cursor: 'pointer' }}
                    >
                        <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                ) : (
                    <div className="mr-4 flex items-center w-8" data-test={`lesson-header-locked-${order}`}>
                        <LockIcon className="w-7 h-7 text-white" />
                    </div>
                )}
                

                <div className="flex-1 flex flex-col w-full">
                    <div className="flex w-full justify-between items-center">
                        <h1 className="text-white mb-2 font-bold text-2xl text-left" data-test={`lesson-header-title-${order}`}>{`${order}. ${title}`}</h1>
                    </div>
                    <p className="text-white mb-2 font-normal italic text-left" data-test={`lesson-header-description-${order}`}>{description}</p>
                </div>
                {/* {isLocked && (
                    <div className="flex items-center justify-end ml-4">
                        <LockIcon className="w-7 h-7 text-white" />
                    </div>
                )} */}
            </div>
        </>
        
    )
}
