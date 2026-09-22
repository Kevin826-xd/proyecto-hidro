import { Router } from "express";
import { loginUserController, registerUserController } from "../controllers/user.controller";

const userRouter = Router();

userRouter.post("/register", registerUserController);
userRouter.post("/login", loginUserController);

export default userRouter;
