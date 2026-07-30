import { Button } from "../Button"

const QuickActions = () => {
  return (
    <div className="rounded-2xl h-1/3 border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4">

          <h2 className="text-lg font-bold text-zinc-900">Quick Actions</h2>

          <div className="flex flex-col gap-3 mt-2">
            <Button
              variant="primary"
              onClick={() => console.log("New Task clicked")}
            >
              + New Task
            </Button>
            <Button
              variant="secondary"
              onClick={() => console.log("New Project clicked")}
            >
              + New Project
            </Button>
          </div>

          <p className="mt-4 text-sm text-zinc-500 italic">
            Stay focused — small steps today lead to big results tomorrow.
          </p>
        </div>
  )
}

export default QuickActions
