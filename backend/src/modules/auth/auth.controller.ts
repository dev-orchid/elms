import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { logAudit } from '../../utils/audit.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      await logAudit({
        userId: result.id,
        action: 'register',
        resource: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        message: 'Registration successful',
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      await logAudit({
        userId: result.user.id,
        action: 'login',
        resource: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        user: result.user,
        token: result.token,
        refresh_token: result.refresh_token,
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refresh_token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.slice(7) || '';
      await authService.logout(token);

      if (req.user) {
        await logAudit({
          userId: req.user.id,
          action: 'logout',
          resource: 'auth',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.id);
      res.json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await authService.updateProfile(req.user!.id, req.body);

      await logAudit({
        userId: req.user!.id,
        action: 'update_profile',
        resource: 'profiles',
        resourceId: req.user!.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const profile = await authService.uploadAvatar(req.user!.id, req.file);

      await logAudit({
        userId: req.user!.id,
        action: 'upload_avatar',
        resource: 'profiles',
        resourceId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  async uploadBanner(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const profile = await authService.uploadBanner(req.user!.id, req.file);

      await logAudit({
        userId: req.user!.id,
        action: 'upload_banner',
        resource: 'profiles',
        resourceId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.changePassword(req.user!.id, req.user!.email, req.body);

      await logAudit({
        userId: req.user!.id,
        action: 'change_password',
        resource: 'auth',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
