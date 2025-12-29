// middleware/auth.ts
import jwt from 'jsonwebtoken';

export const protect = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // This contains the { id, email } you signed in login
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};