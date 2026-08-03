import { Router } from "express";
import type { Request, Response } from "express";
import { workspaces} from "../data/fakeStore.js";

const router = Router({
  mergeParams: true,
});

router.get('/', (req : Request, res: Response) => {
    res.json({
        workspaces
    })
})

export default router;