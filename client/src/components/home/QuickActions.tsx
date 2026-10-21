import { Link } from "react-router-dom";

const QuickActions = () => {
  return (
    <div className="rounded-2xl h-1/3 border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4">

          <h2 className="text-lg font-bold text-zinc-900">Quick Actions</h2>

          <div className="flex flex-col gap-3 mt-2">
            <Link to="/tasks?newTask=1" className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">+ New Task</Link>
            <Link to="/projects?newProject=1" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30">+ New Project</Link>
          </div>

          <p className="mt-4 text-sm text-zinc-500 italic">
            Stay focused — small steps today lead to big results tomorrow.
          </p>
        </div>
  )
}

export default QuickActions
