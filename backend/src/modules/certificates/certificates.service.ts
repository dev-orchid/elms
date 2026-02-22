import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ValidationError } from '../../lib/errors.js';

export class CertificatesService {
  async generate(courseId: string, userId: string) {
    // Verify enrollment is completed
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      throw new ValidationError('User is not enrolled in this course');
    }
    if (enrollment.status !== 'completed') {
      throw new ValidationError('Course must be completed before generating a certificate');
    }

    // Verify course has certification enabled
    const { data: course } = await supabase
      .from('courses')
      .select('id, title, is_certification_enabled')
      .eq('id', courseId)
      .single();

    if (!course) {
      throw new NotFoundError('Course');
    }
    if (!course.is_certification_enabled) {
      throw new ValidationError('This course does not offer certificates');
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      return existing;
    }

    // Generate verification code via DB function
    const { data: codeResult } = await supabase.rpc('generate_verification_code');
    const verificationCode = codeResult as string;

    if (!verificationCode) {
      throw new AppError('Failed to generate verification code', 500);
    }

    // Get user info for the certificate
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    // Generate certificate HTML for PDF
    const html = this.generateCertificateHTML(
      `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
      course.title,
      verificationCode,
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    );

    // Upload HTML as the certificate (PDF generation requires puppeteer, which is optional)
    let certificateUrl: string | null = null;

    try {
      const htmlBuffer = Buffer.from(html, 'utf-8');
      const filePath = `certificates/${userId}/${verificationCode}.html`;

      const { error: uploadErr } = await supabase.storage
        .from('course-content')
        .upload(filePath, htmlBuffer, {
          contentType: 'text/html',
          upsert: true,
        });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from('course-content')
          .getPublicUrl(filePath);
        certificateUrl = urlData?.publicUrl || null;
      }
    } catch {
      // Non-fatal: certificate record is still created without URL
    }

    // Insert certificate record
    const { data: cert, error: insertErr } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        course_id: courseId,
        verification_code: verificationCode,
        certificate_url: certificateUrl,
        issued_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertErr) {
      if (insertErr.message.includes('duplicate') || insertErr.message.includes('unique')) {
        // Race condition: certificate was created between our check and insert
        const { data: dup } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();
        return dup;
      }
      throw new AppError('Failed to create certificate: ' + insertErr.message, 500);
    }

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'certificate_issued',
      title: 'Certificate Earned!',
      body: `Your certificate for "${course.title}" is ready!`,
      reference_url: '/learner/certificates',
    });

    return cert;
  }

  async getMyCertificates(userId: string) {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        course:courses(id, title, slug, thumbnail_url)
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch certificates', 500);
    }

    return { certificates: data || [] };
  }

  async verify(code: string) {
    const { data: cert, error } = await supabase
      .from('certificates')
      .select(`
        *,
        user:profiles(id, first_name, last_name, avatar_url),
        course:courses(id, title, slug, thumbnail_url, description)
      `)
      .eq('verification_code', code)
      .single();

    if (error || !cert) {
      throw new NotFoundError('Certificate');
    }

    return { certificate: cert };
  }

  private generateCertificateHTML(
    name: string,
    courseTitle: string,
    code: string,
    date: string,
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: landscape; margin: 0; }
    body {
      margin: 0; padding: 60px;
      font-family: 'Georgia', serif;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
    }
    .cert {
      border: 3px solid #0d9488;
      padding: 60px 80px;
      text-align: center;
      max-width: 900px;
      width: 100%;
      position: relative;
    }
    .cert::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 1px solid #99f6e4;
    }
    .logo { font-size: 18px; color: #0d9488; letter-spacing: 4px; text-transform: uppercase; font-weight: bold; }
    h1 { font-size: 42px; color: #1e293b; margin: 20px 0 10px; }
    .subtitle { color: #64748b; font-size: 16px; margin-bottom: 30px; }
    .name { font-size: 32px; color: #0d9488; border-bottom: 2px solid #0d9488; display: inline-block; padding-bottom: 4px; margin: 10px 0; }
    .course { font-size: 22px; color: #334155; margin: 20px 0; }
    .date { font-size: 14px; color: #94a3b8; margin-top: 30px; }
    .code { font-size: 12px; color: #cbd5e1; margin-top: 10px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="cert">
    <div class="logo">Finesse ELMS</div>
    <h1>Certificate of Completion</h1>
    <p class="subtitle">This is to certify that</p>
    <p class="name">${this.escapeHtml(name)}</p>
    <p class="subtitle">has successfully completed the course</p>
    <p class="course">${this.escapeHtml(courseTitle)}</p>
    <p class="date">Issued on ${date}</p>
    <p class="code">Verification Code: ${code}</p>
  </div>
</body>
</html>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const certificatesService = new CertificatesService();
