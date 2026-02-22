import { Request, Response, NextFunction } from 'express';
import { certificatesService } from './certificates.service.js';
import { logAudit } from '../../utils/audit.js';

export class CertificatesController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.user_id || req.user!.id;
      const cert = await certificatesService.generate(
        req.body.course_id,
        userId,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'generate_certificate',
        resource: 'certificates',
        resourceId: cert.id,
        changes: { course_id: req.body.course_id, for_user: userId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ certificate: cert });
    } catch (err) {
      next(err);
    }
  }

  async getMyCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await certificatesService.getMyCertificates(req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async verify(req: Request<{ code: string }>, res: Response, next: NextFunction) {
    try {
      const result = await certificatesService.verify(req.params.code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const certificatesController = new CertificatesController();
