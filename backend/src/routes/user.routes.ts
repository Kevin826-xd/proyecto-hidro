import { Router } from "express";
import {
  loginUserController,
  registerUserController,
  resendCodeController,
  verifyEmailController,
} from "../controllers/user.controller";
import { loginRateLimit, registerRateLimit, verificationRateLimit } from "../middlewares/rate-limit.middleware";

const userRouter = Router();

userRouter.post("/register", registerRateLimit, registerUserController);
userRouter.post("/login", loginRateLimit, loginUserController);
// La persona ingresa el código de 6 dígitos que le llegó al correo.
userRouter.post("/verify", verificationRateLimit, verifyEmailController);
userRouter.post("/resend-code", verificationRateLimit, resendCodeController);

export default userRouter;
