import { Router } from "express";
import {
  decideApprovalController,
  loginUserController,
  registerUserController,
  showApprovalController,
} from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/login", loginUserController);
userRouter.get("/approval/:token", showApprovalController);
userRouter.post("/approval/:token", decideApprovalController);

export default userRouter;
