import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_super_segura_aqui_minimo_32_caracteres';
const JWT_EXPIRES_IN = '24h';

// =====================================================
// TIPOS
// =====================================================

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  employeeId?: number;
}

export interface JwtPayload extends AuthUser {
  iat: number;
  exp: number;
}

// =====================================================
// FUNÇÕES DE CRIPTOGRAFIA
// =====================================================

/**
 * Hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Comparar senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// =====================================================
// JWT
// =====================================================

/**
 * Gerar JWT token
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verificar JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Decodificar token sem verificar (use com cuidado)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

// =====================================================
// MIDDLEWARES DE AUTENTICAÇÃO
// =====================================================

/**
 * Middleware: Verificar JWT
 */
export function authenticateToken(
  req: Request & { user?: AuthUser },
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(403).json({ error: 'Token inválido ou expirado' });
    return;
  }

  req.user = user as AuthUser;
  next();
}

/**
 * Middleware: Verificar role específica
 */
export function authorize(...allowedRoles: string[]) {
  return (
    req: Request & { user?: AuthUser },
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }

    next();
  };
}

/**
 * Middleware: Verificar cookie de session (alternativa)
 */
export function sessionAuth(
  req: Request & { user?: AuthUser },
  res: Response,
  next: NextFunction
): void {
  const token = req.cookies?.['auth_token'] || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(403).json({ error: 'Session expirada' });
    return;
  }

  req.user = user as AuthUser;
  next();
}

// =====================================================
// VALIDAÇÕES
// =====================================================

/**
 * Validar força da senha
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter letras minúsculas');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter letras maiúsculas');
  }
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter números');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter caracteres especiais (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar username
 */
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (username.length < 3) {
    errors.push('Username deve ter no mínimo 3 caracteres');
  }
  if (username.length > 20) {
    errors.push('Username deve ter no máximo 20 caracteres');
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username só pode conter letras, números, - e _');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// =====================================================
// RATE LIMITING (Simples)
// =====================================================

const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos

/**
 * Verificar limite de tentativas
 */
export function checkLoginAttempts(identifier: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    loginAttempts.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (now - attempt.timestamp > ATTEMPT_WINDOW) {
    loginAttempts.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (attempt.count >= ATTEMPT_LIMIT) {
    return false;
  }

  attempt.count++;
  return true;
}

/**
 * Resetar tentativas
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Limpar tentativas expiradas
 */
export function cleanupLoginAttempts(): void {
  const now = Date.now();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.timestamp > ATTEMPT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
}

// Limpar a cada 10 minutos
setInterval(cleanupLoginAttempts, 10 * 60 * 1000);
