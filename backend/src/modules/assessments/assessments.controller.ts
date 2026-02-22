import { Request, Response, NextFunction } from 'express';
import { assessmentsService } from './assessments.service.js';
import { logAudit } from '../../utils/audit.js';

export class AssessmentsController {
  // ─── Question Bank ──────────────────────────────────────

  async listQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.listQuestions(
        req.query as Record<string, string>,
        req.user!.id,
        req.user!.role,
      );
      res.json(result);
    } catch (err) { next(err); }
  }

  async createQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await assessmentsService.createQuestion(req.body, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'create_question',
        resource: 'question_bank',
        resourceId: question.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ question });
    } catch (err) { next(err); }
  }

  async updateQuestion(req: Request<{ questionId: string }>, res: Response, next: NextFunction) {
    try {
      const question = await assessmentsService.updateQuestion(req.params.questionId, req.body, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'update_question',
        resource: 'question_bank',
        resourceId: req.params.questionId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ question });
    } catch (err) { next(err); }
  }

  async deleteQuestion(req: Request<{ questionId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.deleteQuestion(req.params.questionId, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'delete_question',
        resource: 'question_bank',
        resourceId: req.params.questionId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Question deleted' });
    } catch (err) { next(err); }
  }

  async bulkDeleteQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      await assessmentsService.bulkDeleteQuestions(req.body.ids, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'bulk_delete_questions',
        resource: 'question_bank',
        changes: { ids: req.body.ids },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Questions deleted' });
    } catch (err) { next(err); }
  }

  // ─── Assessments ────────────────────────────────────────

  async listAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.listAssessments(
        req.query as Record<string, string>,
        req.user!.id,
        req.user!.role,
      );
      res.json(result);
    } catch (err) { next(err); }
  }

  async getAssessment(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentsService.getAssessment(req.params.assessmentId);
      res.json({ assessment });
    } catch (err) { next(err); }
  }

  async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentsService.createAssessment(req.body, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'create_assessment',
        resource: 'assessments',
        resourceId: assessment.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ assessment });
    } catch (err) { next(err); }
  }

  async updateAssessment(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      const assessment = await assessmentsService.updateAssessment(
        req.params.assessmentId, req.body, req.user!.id, req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'update_assessment',
        resource: 'assessments',
        resourceId: req.params.assessmentId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ assessment });
    } catch (err) { next(err); }
  }

  async deleteAssessment(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.deleteAssessment(req.params.assessmentId, req.user!.id, req.user!.role);

      await logAudit({
        userId: req.user!.id,
        action: 'delete_assessment',
        resource: 'assessments',
        resourceId: req.params.assessmentId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Assessment deleted' });
    } catch (err) { next(err); }
  }

  async addQuestions(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.addQuestions(
        req.params.assessmentId, req.body.question_ids, req.user!.id, req.user!.role,
      );
      res.json({ message: 'Questions added' });
    } catch (err) { next(err); }
  }

  async removeQuestion(req: Request<{ assessmentId: string; questionId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.removeQuestion(
        req.params.assessmentId, req.params.questionId, req.user!.id, req.user!.role,
      );
      res.json({ message: 'Question removed' });
    } catch (err) { next(err); }
  }

  async reorderQuestions(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.reorderQuestions(
        req.params.assessmentId, req.body.order, req.user!.id, req.user!.role,
      );
      res.json({ message: 'Questions reordered' });
    } catch (err) { next(err); }
  }

  // ─── Submissions ────────────────────────────────────────

  async startSubmission(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.startSubmission(req.params.assessmentId, req.user!.id);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  async saveAnswer(req: Request<{ submissionId: string }>, res: Response, next: NextFunction) {
    try {
      await assessmentsService.saveAnswer(req.params.submissionId, req.body, req.user!.id);
      res.json({ message: 'Answer saved' });
    } catch (err) { next(err); }
  }

  async submitSubmission(req: Request<{ submissionId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.submitSubmission(req.params.submissionId, req.user!.id);

      await logAudit({
        userId: req.user!.id,
        action: 'submit_assessment',
        resource: 'submissions',
        resourceId: req.params.submissionId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ result });
    } catch (err) { next(err); }
  }

  async getResults(req: Request<{ submissionId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.getSubmissionResults(
        req.params.submissionId, req.user!.id, req.user!.role,
      );
      res.json(result);
    } catch (err) { next(err); }
  }

  // ─── Grading ──────────────────────────────────────────

  async listSubmissions(req: Request<{ assessmentId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await assessmentsService.listSubmissions(
        req.params.assessmentId,
        req.query as Record<string, string>,
        req.user!.id,
        req.user!.role,
      );
      res.json(result);
    } catch (err) { next(err); }
  }

  async gradeSubmission(req: Request<{ submissionId: string }>, res: Response, next: NextFunction) {
    try {
      const submission = await assessmentsService.gradeSubmission(
        req.params.submissionId, req.body, req.user!.id, req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'grade_submission',
        resource: 'submissions',
        resourceId: req.params.submissionId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ submission });
    } catch (err) { next(err); }
  }
}

export const assessmentsController = new AssessmentsController();
