import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { Session } from '../types/models'
import { dateUtils } from '../utils/timezone'

export class PDFExportService {
  /**
   * Convert image URL to base64 data URL for PDF embedding
   */
  private static async imageUrlToBase64(url: string): Promise<string> {
    try {
      console.log('📸 Converting image to base64:', url)
      
      // Download the image to local cache
      const fileUri = `${FileSystem.cacheDirectory}temp_image_${Date.now()}.jpg`
      const downloadResult = await FileSystem.downloadAsync(url, fileUri)
      
      if (downloadResult.status !== 200) {
        console.warn('⚠️ Failed to download image:', downloadResult.status)
        return url // Fallback to original URL
      }
      
      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      
      // Clean up temp file
      await FileSystem.deleteAsync(fileUri, { idempotent: true })
      
      // Determine mime type from URL extension
      const mimeType = url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
      
      console.log('✅ Image converted to base64 successfully')
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error('❌ Error converting image to base64:', error)
      return url // Fallback to original URL
    }
  }

  /**
   * Convert all images in session to base64
   */
  private static async prepareSessionImages(session: Session): Promise<string[]> {
    if (!session.report_images || session.report_images.length === 0) {
      return []
    }
    
    console.log(`📸 Processing ${session.report_images.length} images...`)
    const base64Images = await Promise.all(
      session.report_images.map(url => this.imageUrlToBase64(url))
    )
    console.log('✅ All images processed')
    return base64Images
  }

  static async exportSession(session: Session): Promise<void> {
    try {
      // Convert images to base64 first
      const base64Images = await this.prepareSessionImages(session)
      const sessionWithBase64 = { ...session, report_images: base64Images }
      
      const html = this.generateSessionHTML(sessionWithBase64)
      const fileName = `OJT-Session-${dateUtils.formatPH(session.date, 'yyyy-MM-dd')}.pdf`
      
      console.log('🖨️ Generating PDF for session:', session.id)
      console.log('📱 Platform:', Platform.OS)
      
      // On web, use print API directly (opens print dialog)
      if (Platform.OS === 'web') {
        console.log('🌐 Using web print dialog')
        await Print.printAsync({ html })
        return
      }
      
      // On native platforms (iOS/Android), generate file and share
      console.log('📱 Generating PDF file for native platform')
      const result = await Print.printToFileAsync({ 
        html,
        base64: false 
      })
      
      if (!result || !result.uri) {
        throw new Error('Failed to generate PDF file')
      }
      
      console.log('✅ PDF generated:', result.uri)
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf',
        })
      } else {
        throw new Error('Sharing is not available on this device')
      }
    } catch (error) {
      console.error('PDF Export Error:', error)
      throw error
    }
  }

  static async exportMultipleSessions(sessions: Session[]): Promise<void> {
    try {
      if (!sessions || sessions.length === 0) {
        throw new Error('No sessions to export')
      }
      
      console.log('🖨️ Generating PDF for', sessions.length, 'sessions')
      console.log('📱 Platform:', Platform.OS)
      
      // Convert all images to base64 for all sessions
      const sessionsWithBase64 = await Promise.all(
        sessions.map(async (session) => {
          const base64Images = await this.prepareSessionImages(session)
          return { ...session, report_images: base64Images }
        })
      )
      
      const html = this.generateMultipleSessionsHTML(sessionsWithBase64)
      const fileName = `OJT-Report-${dateUtils.formatPH(new Date(), 'yyyy-MM-dd')}.pdf`
      
      // On web, use print API directly (opens print dialog)
      if (Platform.OS === 'web') {
        console.log('🌐 Using web print dialog')
        await Print.printAsync({ html })
        return
      }
      
      // On native platforms (iOS/Android), generate file and share
      console.log('📱 Generating PDF file for native platform')
      const result = await Print.printToFileAsync({ 
        html,
        base64: false 
      })
      
      if (!result || !result.uri) {
        throw new Error('Failed to generate PDF file')
      }
      
      console.log('✅ PDF generated:', result.uri)
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: fileName,
          UTI: 'com.adobe.pdf',
        })
      } else {
        throw new Error('Sharing is not available on this device')
      }
    } catch (error) {
      console.error('PDF Export Error:', error)
      throw error
    }
  }

  private static generateSessionHTML(session: Session): string {
    const hasBreaks = session.breaks && session.breaks.length > 0
    const hasReport = session.journal || (session.report_images && session.report_images.length > 0)
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OJT Daily Activity Report - ${dateUtils.formatPH(session.date, 'MMM dd, yyyy')}</title>
          <style>
            @page {
              margin: 0.75in;
              size: letter;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
              color: #1a1a1a;
              font-size: 11pt;
              line-height: 1.7;
              background: white;
              -webkit-font-smoothing: antialiased;
            }
            .document-header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2563eb;
            }
            .document-title {
              font-size: 28pt;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .document-subtitle {
              font-size: 16pt;
              font-weight: 600;
              color: #475569;
              margin-bottom: 8px;
            }
            .document-date {
              font-size: 13pt;
              color: #64748b;
              margin-top: 12px;
              font-weight: 500;
            }
            .info-section {
              margin: 30px 0;
              background: linear-gradient(to right, #f8fafc 0%, #f1f5f9 100%);
              border-left: 4px solid #2563eb;
              border-radius: 8px;
              padding: 24px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .info-section-title {
              font-size: 14pt;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 2px solid #cbd5e1;
              letter-spacing: 0.5px;
            }
            .info-row {
              display: flex;
              margin: 14px 0;
              font-size: 11pt;
              align-items: baseline;
            }
            .info-label {
              font-weight: 600;
              color: #334155;
              width: 180px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              color: #0f172a;
              padding-left: 16px;
              font-weight: 500;
            }
            .hours-highlight {
              font-size: 16pt;
              font-weight: 700;
              color: #2563eb;
              background: #dbeafe;
              padding: 4px 12px;
              border-radius: 6px;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              font-size: 11pt;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            th {
              background: linear-gradient(to bottom, #1e40af 0%, #1e3a8a 100%);
              color: white;
              padding: 14px 12px;
              text-align: center;
              font-weight: 600;
              font-size: 10pt;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            td {
              padding: 12px;
              text-align: center;
              border-bottom: 1px solid #e2e8f0;
              background: white;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .section-title {
              font-size: 14pt;
              font-weight: 700;
              color: #1e40af;
              margin: 35px 0 20px 0;
              padding: 12px 16px;
              background: linear-gradient(to right, #dbeafe 0%, #e0f2fe 100%);
              border-left: 4px solid #2563eb;
              border-radius: 6px;
              letter-spacing: 0.3px;
            }
            .section-content {
              margin: 20px 0;
              padding: 24px;
              background: #fafbfc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              min-height: 80px;
              line-height: 1.9;
            }
            .content-text {
              white-space: pre-wrap;
              color: #334155;
              font-size: 11pt;
            }
            .subsection-label {
              font-weight: 600;
              font-size: 11pt;
              color: #1e40af;
              margin: 20px 0 12px 0;
              padding: 8px 12px;
              background: #eff6ff;
              border-left: 3px solid #60a5fa;
              border-radius: 4px;
            }
            .images-container {
              margin: 24px 0;
              padding: 20px;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .images-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 20px;
              margin-top: 16px;
            }
            .image-item {
              text-align: center;
              page-break-inside: avoid;
              background: #f8fafc;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .image-item img {
              max-width: 100%;
              height: auto;
              max-height: 320px;
              border-radius: 6px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.12);
              object-fit: contain;
              background: white;
            }
            .image-caption {
              font-size: 9pt;
              color: #64748b;
              margin-top: 8px;
              font-weight: 500;
            }
            .notes-box {
              margin: 30px 0;
              padding: 20px;
              background: #fffbeb;
              border: 1px solid #fbbf24;
              border-left: 4px solid #f59e0b;
              border-radius: 8px;
              font-size: 10pt;
              line-height: 1.7;
            }
            .notes-box strong {
              color: #92400e;
              font-size: 11pt;
            }
            .signature-section {
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .certification-text {
              margin-bottom: 40px;
              font-size: 11pt;
              line-height: 1.8;
              padding: 20px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              color: #334155;
            }
            .signature-container {
              display: flex;
              justify-content: space-around;
              margin-top: 60px;
              gap: 40px;
            }
            .signature-box {
              flex: 1;
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1e40af;
              padding-top: 8px;
              margin-top: 70px;
              min-width: 220px;
            }
            .signature-label {
              font-size: 10pt;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .signature-date {
              font-size: 9pt;
              color: #64748b;
              margin-top: 6px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 2px solid #cbd5e1;
              text-align: center;
              font-size: 9pt;
              color: #64748b;
              line-height: 1.6;
            }
            .footer strong {
              color: #1e40af;
              font-size: 10pt;
            }
            .footer-divider {
              margin: 8px 0;
              color: #cbd5e1;
            }
          </style>
        </head>
        <body>
          <!-- Document Header -->
          <div class="document-header">
            <div class="document-title">On-The-Job Training</div>
            <div class="document-subtitle">Daily Activity Report</div>
            <div class="document-date">${dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}</div>
          </div>

          <!-- Time Information Section -->
          <div class="info-section">
            <div class="info-section-title">I. Time Record</div>
            <div class="info-row">
              <span class="info-label">Date of Activity:</span>
              <span class="info-value">${dateUtils.formatPH(session.date, 'MMMM dd, yyyy')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Day of Week:</span>
              <span class="info-value">${dateUtils.formatPH(session.date, 'EEEE')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time In:</span>
              <span class="info-value">${this.formatTimeOnly(session.start_time)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time Out:</span>
              <span class="info-value">${session.end_time ? this.formatTimeOnly(session.end_time) : 'Session Ongoing'}</span>
            </div>
            ${hasBreaks ? `
              <div class="info-row">
                <span class="info-label">Break Periods:</span>
                <span class="info-value">${session.breaks!.length} break${session.breaks!.length > 1 ? 's' : ''} taken</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Total Hours Rendered:</span>
              <span class="info-value hours-highlight">${session.total_hours.toFixed(2)} Hours</span>
            </div>
          </div>

          ${hasBreaks ? `
            <!-- Break Details Table -->
            <div class="section-title">Break Period Details</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 20%;">Break No.</th>
                  <th style="width: 40%;">Start Time</th>
                  <th style="width: 40%;">End Time</th>
                </tr>
              </thead>
              <tbody>
                ${session.breaks!.map((brk, index) => `
                  <tr>
                    <td><strong>Break ${index + 1}</strong></td>
                    <td>${this.formatTimeOnly(brk.start_time)}</td>
                    <td>${brk.end_time ? this.formatTimeOnly(brk.end_time) : 'Ongoing'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${hasReport ? `
            <!-- Session Report -->
            <div class="section-title">II. Session Report</div>

            ${session.journal ? `
              <div style="margin: 24px 0;">
                <div class="subsection-label">Daily Journal</div>
                <div class="section-content">
                  <div class="content-text">${session.journal}</div>
                </div>
              </div>
            ` : ''}

            ${session.report_images && session.report_images.length > 0 ? `
              <div style="margin: 24px 0;">
                <div class="subsection-label">Supporting Documents / Photos (${session.report_images.length})</div>
                <div class="images-container">
                  <div class="images-grid">
                    ${session.report_images.map((imageUrl, index) => `
                      <div class="image-item">
                        <img src="${imageUrl}" alt="Supporting Document ${index + 1}" />
                        <div class="image-caption">Document ${index + 1} of ${session.report_images!.length}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          ` : ''}

          <!-- Important Note -->
          <div class="notes-box">
            <strong>Important Notice:</strong> This document serves as official documentation of on-the-job training hours and activities. 
            All information provided must be accurate and verifiable. This report may be used for academic credit, 
            professional evaluation, or institutional compliance purposes.
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="certification-text">
              <strong>CERTIFICATION</strong><br/><br/>
              I hereby certify that the information stated above is true and accurate to the best of my knowledge. 
              I have completed the indicated hours of training and performed the described activities on the specified date. 
              This document is submitted for official record and evaluation purposes.
            </div>
            
            <div class="signature-container">
              <div class="signature-box">
                <div class="signature-line">
                  <div class="signature-label">Trainee / Student</div>
                  <div class="signature-date">Date: _________________</div>
                </div>
              </div>
              <div class="signature-box">
                <div class="signature-line">
                  <div class="signature-label">Supervisor / Mentor</div>
                  <div class="signature-date">Date: _________________</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>OJT TRACKER - PROFESSIONAL TRAINING MANAGEMENT SYSTEM</strong></p>
            <div class="footer-divider">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            <p>Document Generated: ${dateUtils.formatPH(new Date(), 'MMMM dd, yyyy')} at ${dateUtils.formatPH(new Date(), 'hh:mm a')}</p>
            <p>Document ID: OJT-${session.id.substring(0, 8).toUpperCase()}-${dateUtils.formatPH(session.date, 'yyyyMMdd')}</p>
            <p style="margin-top: 12px; font-size: 8pt; font-style: italic;">
              This is a system-generated document. For verification purposes, please contact the issuing institution.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private static formatTimeOnly(timeStr: string | null): string {
    if (!timeStr) return '-'
    try {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours % 12 || 12
      return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
    } catch {
      return timeStr
    }
  }

  private static generateMultipleSessionsHTML(sessions: Session[]): string {
    const totalHours = sessions.reduce((sum, s) => sum + s.total_hours, 0)
    const startDate = sessions[sessions.length - 1]?.date
    const endDate = sessions[0]?.date
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>OJT Training Report</title>
          <style>
            @page {
              margin: 0.75in;
              size: letter;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
              color: #1a1a1a;
              font-size: 11pt;
              line-height: 1.7;
              background: white;
              -webkit-font-smoothing: antialiased;
            }
            .document-header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #2563eb;
            }
            .document-title {
              font-size: 26pt;
              font-weight: 700;
              color: #1e40af;
              margin-bottom: 10px;
              letter-spacing: -0.5px;
            }
            .document-subtitle {
              font-size: 15pt;
              font-weight: 600;
              color: #475569;
              margin-bottom: 6px;
            }
            .report-info {
              margin: 30px 0;
              background: linear-gradient(to right, #f8fafc 0%, #f1f5f9 100%);
              border-left: 4px solid #2563eb;
              border-radius: 8px;
              padding: 24px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .info-row {
              display: flex;
              margin: 12px 0;
              font-size: 11pt;
              align-items: baseline;
            }
            .info-label {
              font-weight: 600;
              color: #334155;
              width: 180px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              color: #0f172a;
              padding-left: 16px;
              font-weight: 500;
            }
            .section-title {
              font-size: 14pt;
              font-weight: 700;
              color: #1e40af;
              margin: 35px 0 20px 0;
              padding: 12px 16px;
              background: linear-gradient(to right, #dbeafe 0%, #e0f2fe 100%);
              border-left: 4px solid #2563eb;
              border-radius: 6px;
              letter-spacing: 0.3px;
            }
            .summary-stats {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin: 25px 0;
            }
            .stat-box {
              text-align: center;
              flex: 1;
              padding: 20px;
              background: white;
              border: 2px solid #dbeafe;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            }
            .stat-value {
              font-size: 22pt;
              font-weight: 700;
              color: #2563eb;
              display: block;
              margin-bottom: 8px;
            }
            .stat-label {
              font-size: 10pt;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin: 20px 0;
              font-size: 11pt;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            th {
              background: linear-gradient(to bottom, #1e40af 0%, #1e3a8a 100%);
              color: white;
              padding: 14px 10px;
              text-align: left;
              font-weight: 600;
              font-size: 10pt;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
              background: white;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .total-row {
              background: linear-gradient(to right, #eff6ff 0%, #dbeafe 100%) !important;
              font-weight: 700;
              color: #1e40af;
            }
            .session-entry {
              page-break-inside: avoid;
              margin: 25px 0;
              padding: 20px;
              background: white;
              border: 1px solid #e2e8f0;
              border-left: 4px solid #60a5fa;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .session-header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 2px solid #e2e8f0;
            }
            .session-date {
              font-weight: 700;
              font-size: 13pt;
              color: #1e40af;
            }
            .session-hours {
              font-weight: 700;
              font-size: 13pt;
              color: #2563eb;
              background: #dbeafe;
              padding: 6px 14px;
              border-radius: 6px;
            }
            .session-detail-row {
              margin: 12px 0;
              font-size: 11pt;
            }
            .detail-label {
              font-weight: 600;
              color: #475569;
              display: inline-block;
              min-width: 140px;
            }
            .detail-value {
              color: #1e293b;
            }
            .detail-content {
              display: block;
              margin: 8px 0 8px 140px;
              padding: 16px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              white-space: pre-wrap;
              line-height: 1.8;
              color: #334155;
            }
            .break-list {
              margin-left: 140px;
              margin-top: 8px;
            }
            .break-item {
              font-size: 10pt;
              color: #64748b;
              margin-bottom: 6px;
              padding-left: 12px;
              border-left: 2px solid #cbd5e1;
            }
            .images-container {
              margin: 16px 0 16px 140px;
              padding: 16px;
              background: #fafbfc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .images-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              gap: 16px;
              margin-top: 12px;
            }
            .image-item {
              text-align: center;
              page-break-inside: avoid;
              background: white;
              padding: 10px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            .image-item img {
              max-width: 100%;
              height: auto;
              max-height: 280px;
              border-radius: 4px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
              object-fit: contain;
            }
            .image-caption {
              font-size: 9pt;
              color: #64748b;
              margin-top: 6px;
              font-weight: 500;
            }
            .signature-section {
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .certification-text {
              margin-bottom: 40px;
              font-size: 11pt;
              line-height: 1.8;
              padding: 20px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              color: #334155;
            }
            .signature-container {
              display: flex;
              justify-content: space-around;
              margin-top: 60px;
              gap: 40px;
            }
            .signature-box {
              flex: 1;
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1e40af;
              padding-top: 8px;
              margin-top: 70px;
              min-width: 220px;
            }
            .signature-label {
              font-size: 10pt;
              font-weight: 600;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 2px solid #cbd5e1;
              text-align: center;
              font-size: 9pt;
              color: #64748b;
              line-height: 1.6;
            }
            .footer strong {
              color: #1e40af;
              font-size: 10pt;
            }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <!-- Document Header -->
          <div class="document-header">
            <div class="document-title">On-The-Job Training Report</div>
            <div class="document-subtitle">Work Activity Summary & Hours Documentation</div>
          </div>

          <!-- Report Information -->
          <div class="report-info">
            <div class="info-row">
              <span class="info-label">Report Period:</span>
              <span class="info-value">${dateUtils.formatPH(startDate, 'MMMM dd, yyyy')} - ${dateUtils.formatPH(endDate, 'MMMM dd, yyyy')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Report Generated:</span>
              <span class="info-value">${dateUtils.formatPH(new Date(), 'MMMM dd, yyyy hh:mm a')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Sessions:</span>
              <span class="info-value">${sessions.length} Day${sessions.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Hours Rendered:</span>
              <span class="info-value">${totalHours.toFixed(2)} Hours</span>
            </div>
          </div>

          <!-- Summary Statistics -->
          <div class="section-title">I. Summary of Hours</div>
          <div class="summary-stats">
            <div class="stat-box">
              <span class="stat-value">${sessions.length}</span>
              <span class="stat-label">Total Days</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">${totalHours.toFixed(1)}h</span>
              <span class="stat-label">Total Hours</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">${(totalHours / sessions.length).toFixed(1)}h</span>
              <span class="stat-label">Average per Day</span>
            </div>
          </div>

          <!-- Sessions Table -->
          <div class="section-title">II. Time Log Summary</div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">No.</th>
                <th style="width: 32%;">Date</th>
                <th style="width: 19%;">Time In</th>
                <th style="width: 19%;">Time Out</th>
                <th style="width: 20%;">Hours</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map((session, index) => {
                const formatTimeOnly = (timeStr: string | null) => {
                  if (!timeStr) return '-'
                  try {
                    const [hours, minutes] = timeStr.split(':').map(Number)
                    const period = hours >= 12 ? 'PM' : 'AM'
                    const hour12 = hours % 12 || 12
                    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
                  } catch {
                    return timeStr
                  }
                }
                return `
                <tr>
                  <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                  <td>${dateUtils.formatPH(session.date, 'MMMM dd, yyyy (EEEE)')}</td>
                  <td style="text-align: center;">${formatTimeOnly(session.start_time)}</td>
                  <td style="text-align: center;">${formatTimeOnly(session.end_time)}</td>
                  <td style="text-align: center;"><strong>${session.total_hours.toFixed(2)}h</strong></td>
                </tr>
              `}).join('')}
              <tr>
                <td colspan="4" class="total-row" style="text-align: right; padding-right: 15px;">TOTAL HOURS:</td>
                <td class="total-row" style="text-align: center;"><strong>${totalHours.toFixed(2)}h</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="page-break"></div>

          <!-- Detailed Activity Logs -->
          <div class="section-title">III. Detailed Activity Logs</div>

          ${sessions.map((session, index) => {
            const formatTimeOnly = (timeStr: string | null) => {
              if (!timeStr) return '-'
              try {
                const [hours, minutes] = timeStr.split(':').map(Number)
                const period = hours >= 12 ? 'PM' : 'AM'
                const hour12 = hours % 12 || 12
                return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
              } catch {
                return timeStr
              }
            }
            const hasBreaks = session.breaks && session.breaks.length > 0
            const hasImages = session.report_images && session.report_images.length > 0
            
            return `
            <div class="session-entry">
              <div class="session-header-row">
                <span class="session-date">Day ${index + 1}: ${dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}</span>
                <span class="session-hours">${session.total_hours.toFixed(2)} hours</span>
              </div>
              
              <div class="session-detail-row">
                <span class="detail-label">Time In:</span>
                <span class="detail-value">${formatTimeOnly(session.start_time)}</span>
              </div>
              
              <div class="session-detail-row">
                <span class="detail-label">Time Out:</span>
                <span class="detail-value">${formatTimeOnly(session.end_time) || 'Ongoing'}</span>
              </div>
              
              ${hasBreaks ? `
                <div class="session-detail-row">
                  <span class="detail-label">Break Periods:</span>
                  <span class="detail-value">${session.breaks!.length} break${session.breaks!.length > 1 ? 's' : ''} taken</span>
                </div>
                <div class="break-list">
                  ${session.breaks!.map((brk: any, brkIndex: number) => `
                    <div class="break-item">
                      Break ${brkIndex + 1}: ${formatTimeOnly(brk.start_time)} - ${formatTimeOnly(brk.end_time || null)}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              
              ${session.description ? `
                <div class="session-detail-row">
                  <span class="detail-label">Work Description:</span>
                  <div class="detail-content">${session.description}</div>
                </div>
              ` : ''}
              
              ${session.journal ? `
                <div class="session-detail-row">
                  <span class="detail-label">Daily Journal:</span>
                  <div class="detail-content">${session.journal}</div>
                </div>
              ` : ''}
              
              ${hasImages ? `
                <div class="session-detail-row">
                  <span class="detail-label">Supporting Documents:</span>
                  <span class="detail-value">${session.report_images!.length} attachment${session.report_images!.length > 1 ? 's' : ''}</span>
                </div>
                <div class="images-container">
                  <div class="images-grid">
                    ${session.report_images!.map((imageUrl: string, imgIndex: number) => `
                      <div class="image-item">
                        <img src="${imageUrl}" alt="Document ${imgIndex + 1}" />
                        <div class="image-caption">Document ${imgIndex + 1} of ${session.report_images!.length}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `}).join('')}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="certification-text">
              <strong>CERTIFICATION</strong><br/><br/>
              I hereby certify that the information provided in this report is true and accurate to the best of my knowledge.
              All hours rendered and activities performed have been documented faithfully and are submitted for official evaluation.
            </div>
            
            <div class="signature-container">
              <div class="signature-box">
                <div class="signature-line">
                  <div class="signature-label">Trainee / Student</div>
                </div>
              </div>
              <div class="signature-box">
                <div class="signature-line">
                  <div class="signature-label">Supervisor / Mentor</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>OJT TRACKER - PROFESSIONAL TRAINING MANAGEMENT SYSTEM</strong></p>
            <p style="margin-top: 8px;">This is an official document generated by OJT Tracker System</p>
            <p>Document ID: OJT-REPORT-${dateUtils.formatPH(new Date(), 'yyyyMMdd-HHmmss')}</p>
            <p style="margin-top: 12px; font-size: 8pt; font-style: italic;">
              For verification purposes, please contact the issuing institution.
            </p>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Export multiple sessions as CSV file
   */
  static async exportSessionsAsCSV(sessions: Session[]): Promise<void> {
    try {
      if (!sessions || sessions.length === 0) {
        throw new Error('No sessions to export')
      }
      
      console.log('📊 Generating CSV for', sessions.length, 'sessions')
      
      const formatTimeOnly = (timeStr: string | null) => {
        if (!timeStr) return ''
        try {
          const [hours, minutes] = timeStr.split(':').map(Number)
          const period = hours >= 12 ? 'PM' : 'AM'
          const hour12 = hours % 12 || 12
          return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
        } catch {
          return timeStr
        }
      }
      
      // CSV Header
      const headers = [
        'No.',
        'Date',
        'Day',
        'Time In',
        'Time Out',
        'Break Periods',
        'Total Hours'
      ]
      
      // CSV Rows
      const rows = sessions.map((session, index) => {
        const breakInfo = session.breaks && session.breaks.length > 0
          ? session.breaks.map((brk: any, brkIdx: number) => 
              `Break ${brkIdx + 1}: ${formatTimeOnly(brk.start_time)} - ${formatTimeOnly(brk.end_time)}`
            ).join('; ')
          : 'No breaks'
        
        return [
          index + 1,
          dateUtils.formatPH(session.date, 'MM/dd/yyyy'),
          dateUtils.formatPH(session.date, 'EEEE'),
          formatTimeOnly(session.start_time),
          formatTimeOnly(session.end_time),
          `"${breakInfo}"`, // Quoted to handle commas in break info
          session.total_hours.toFixed(2)
        ]
      })
      
      // Total row
      const totalHours = sessions.reduce((sum, s) => sum + s.total_hours, 0)
      rows.push([
        '',
        '',
        '',
        '',
        'TOTAL:',
        '',
        totalHours.toFixed(2)
      ])
      
      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      const fileName = `OJT-Report-${dateUtils.formatPH(new Date(), 'yyyy-MM-dd')}.csv`
      const fileUri = `${FileSystem.documentDirectory}${fileName}`
      
      // Write CSV file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      })
      
      console.log('✅ CSV generated:', fileUri)
      
      // Share the CSV
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: fileName,
          UTI: 'public.comma-separated-values-text'
        })
      } else {
        throw new Error('Sharing is not available on this device')
      }
    } catch (error) {
      console.error('CSV Export Error:', error)
      throw error
    }
  }
}
