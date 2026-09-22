import { RequestHandler } from "express";
import { createUser, loginUser } from "../services/user.service";

export const registerUserController: RequestHandler = async (request, response) => {
  try {
    const body = request.body ?? {};
    const user = await createUser({
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      password: typeof body.password === "string" ? body.password : "",
    });

    response.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Usuario registrado correctamente",
    });
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};

export const loginUserController: RequestHandler = async (request, response) => {
  try {
    const body = request.body ?? {};
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = await loginUser(email, password);

    if (!user) {
      response.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "Inicio de sesión correcto",
    });
  } catch (error) {
    response.status(400).json({ message: (error as Error).message });
  }
};
