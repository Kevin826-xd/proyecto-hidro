import { Router } from "express";
import {
  decideApprovalController,
  loginUserController,
  registerUserController,
  showApprovalController,
} from "../controllers/user.controller";
import { loginRateLimit } from "../middlewares/rate-limit.middleware";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/login", loginRateLimit, loginUserController);
userRouter.get("/approval/:token", showApprovalController);
userRouter.post("/approval/:token", decideApprovalController);

export default userRouter;
