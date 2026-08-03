import { Router } from "express";
import type { Request, Response } from "express";
import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";

const router = Router({
  mergeParams: true,
});

interface TaskParams {
  projectId: string;
}

interface CreateTaskBody {
  title: string;
  completed?: boolean;
}

router.get('/', (req : Request<TaskParams>, res: Response) => {
    const projectId = req.params.projectId;
    const projectTasks = tasks.filter(
        (task) => task.projectId === projectId,
    );
    res.json(projectTasks);
})

router.post("/", (req: Request<TaskParams, {}, CreateTaskBody>, res: Response) => {
  const projectId = req.params.projectId;
  const { title, completed } = req.body;

  const newTask: Task = {
    id: `t${tasks.length + 1}`,
    projectId,
    title,
    completed: completed ?? false,
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

export default router;
