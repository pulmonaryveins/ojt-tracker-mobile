import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'
import { Session } from '../types/models'
import { dateUtils } from '../utils/timezone'

export class PDFExportService {
  static async exportSession(session: Session): Promise<void> {
    try {
      const html = this.generateSessionHTML(session)
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
      
      const html = this.generateMultipleSessionsHTML(sessions)
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
    const hasReport = session.tasks_completed || session.lessons_learned || (session.report_images && session.report_images.length > 0)
    
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
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              font-size: 12pt;
              line-height: 1.6;
              background: white;
            }
            .document-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px double #000;
            }
            .document-title {
              font-size: 22pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 1.5px;
            }
            .document-subtitle {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .document-date {
              font-size: 12pt;
              margin-top: 8px;
              font-style: italic;
            }
            .info-section {
              margin: 25px 0;
              border: 2px solid #000;
              padding: 20px;
              background: #f9f9f9;
            }
            .info-section-title {
              font-size: 13pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #333;
            }
            .info-row {
              display: flex;
              margin: 10px 0;
              font-size: 11pt;
            }
            .info-label {
              font-weight: bold;
              width: 200px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              border-bottom: 1px dotted #666;
              padding-left: 15px;
              min-height: 20px;
            }
            .hours-highlight {
              font-size: 14pt;
              font-weight: bold;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 11pt;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th {
              background: #e0e0e0;
              padding: 8px;
              text-align: center;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 10pt;
            }
            td {
              padding: 8px;
              text-align: center;
            }
            .section-title {
              font-size: 13pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 25px 0 15px 0;
              padding: 8px 10px;
              background: #e0e0e0;
              border: 1px solid #000;
            }
            .section-content {
              margin: 15px 0;
              padding: 20px;
              border: 1px solid #666;
              min-height: 100px;
              text-align: justify;
            }
            .content-text {
              white-space: pre-wrap;
              line-height: 1.8;
            }
            .empty-field {
              color: #999;
              font-style: italic;
              text-align: center;
            }
            .notes-box {
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #000;
              background: #fafafa;
              font-size: 10pt;
            }
            .signature-section {
              margin-top: 60px;
              page-break-inside: avoid;
            }
            .certification-text {
              margin-bottom: 30px;
              font-size: 11pt;
              text-align: justify;
              padding: 15px;
              border: 1px solid #666;
              background: #f9f9f9;
            }
            .signature-container {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-box {
              flex: 1;
              text-align: center;
              margin: 0 20px;
            }
            .signature-line {
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 60px;
            }
            .signature-label {
              font-size: 10pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .signature-date {
              font-size: 9pt;
              margin-top: 5px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 15px;
              border-top: 2px solid #000;
              text-align: center;
              font-size: 9pt;
              color: #666;
            }
            .footer-divider {
              margin: 5px 0;
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
                    <td>Break ${index + 1}</td>
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

            ${session.tasks_completed ? `
              <div style="margin: 20px 0;">
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 10px; padding: 5px 10px; background: #e8f5e9; border-left: 4px solid #4caf50;">
                  A. Tasks Completed
                </div>
                <div class="section-content">
                  <div class="content-text">${session.tasks_completed}</div>
                </div>
              </div>
            ` : ''}

            ${session.lessons_learned ? `
              <div style="margin: 20px 0;">
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 10px; padding: 5px 10px; background: #fff3e0; border-left: 4px solid #ff9800;">
                  B. Lessons Learned / Skills Acquired
                </div>
                <div class="section-content">
                  <div class="content-text">${session.lessons_learned}</div>
                </div>
              </div>
            ` : ''}

            ${session.report_images && session.report_images.length > 0 ? `
              <div style="margin: 20px 0;">
                <div style="font-weight: bold; font-size: 11pt; margin-bottom: 10px; padding: 5px 10px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                  C. Supporting Documents / Photos
                </div>
                <div class="section-content" style="text-align: center;">
                  <div class="content-text" style="margin-bottom: 15px;">
                    <strong>${session.report_images.length}</strong> supporting document${session.report_images.length > 1 ? 's' : ''} ${session.report_images.length > 1 ? 'have' : 'has'} been attached to this activity report.
                  </div>
                  <div class="images-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    ${session.report_images.map((imageUrl, index) => `
                      <div style="text-align: center; page-break-inside: avoid;">
                        <img src="${imageUrl}" alt="Supporting Document ${index + 1}" style="max-width: 100%; max-height: 300px; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                        <div style="font-size: 10pt; color: #666; margin-top: 5px;">Document ${index + 1}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
          ` : ''}

          <!-- Important Note -->
          <div class="notes-box">
            <strong>Note:</strong> This document serves as official documentation of on-the-job training hours and activities. 
            All information provided must be accurate and verifiable. This report may be used for academic credit, 
            professional evaluation, or institutional compliance purposes.
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="certification-text">
              <strong>CERTIFICATION:</strong><br/><br/>
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
            <p style="margin-top: 10px; font-size: 8pt; font-style: italic;">
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
      const [hours, minutes, seconds] = timeStr.split(':').map(Number)
      const period = hours >= 12 ? 'PM' : 'AM'
      const hour12 = hours % 12 || 12
      return `${hour12}:${String(minutes).padStart(2, '0')}:${String(seconds || 0).padStart(2, '0')} ${period}`
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
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              font-size: 12pt;
              line-height: 1.6;
              background: white;
            }
            .document-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 3px double #000;
            }
            .document-title {
              font-size: 20pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 1px;
            }
            .document-subtitle {
              font-size: 14pt;
              margin-bottom: 4px;
            }
            .report-info {
              margin: 20px 0 30px 0;
              border: 2px solid #000;
              padding: 15px;
            }
            .info-row {
              display: flex;
              margin: 8px 0;
              font-size: 11pt;
            }
            .info-label {
              font-weight: bold;
              width: 180px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
              border-bottom: 1px solid #333;
              padding-left: 10px;
            }
            .section-title {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 25px 0 15px 0;
              padding: 8px 0;
              border-bottom: 2px solid #000;
            }
            .summary-stats {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #000;
              background: #f5f5f5;
            }
            .stat-box {
              text-align: center;
              flex: 1;
            }
            .stat-value {
              font-size: 18pt;
              font-weight: bold;
              display: block;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 10pt;
              text-transform: uppercase;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0 25px 0;
              font-size: 11pt;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th {
              background: #e8e8e8;
              padding: 10px 8px;
              text-align: left;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 10pt;
            }
            td {
              padding: 8px;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            .session-entry {
              page-break-inside: avoid;
              margin: 20px 0;
              padding: 15px;
              border: 1px solid #000;
            }
            .session-header-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #333;
            }
            .session-date {
              font-weight: bold;
              font-size: 12pt;
            }
            .session-hours {
              font-weight: bold;
              font-size: 12pt;
            }
            .session-detail-row {
              margin: 10px 0;
              font-size: 11pt;
            }
            .detail-label {
              font-weight: bold;
              display: inline-block;
              min-width: 140px;
            }
            .detail-content {
              display: block;
              margin: 5px 0 5px 140px;
              text-align: justify;
              white-space: pre-wrap;
            }
            .signature-section {
              margin-top: 50px;
              page-break-inside: avoid;
            }
            .signature-line {
              margin-top: 50px;
              border-top: 2px solid #000;
              width: 300px;
              padding-top: 5px;
              text-align: center;
            }
            .signature-label {
              font-size: 10pt;
              text-transform: uppercase;
            }
            .footer {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 9pt;
              color: #666;
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
                <th style="width: 12%;">No.</th>
                <th style="width: 28%;">Date</th>
                <th style="width: 20%;">Time In</th>
                <th style="width: 20%;">Time Out</th>
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
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${dateUtils.formatPH(session.date, 'MMMM dd, yyyy')}</td>
                  <td>${formatTimeOnly(session.start_time)}</td>
                  <td>${formatTimeOnly(session.end_time)}</td>
                  <td><strong>${session.total_hours.toFixed(2)}h</strong></td>
                </tr>
              `}).join('')}
              <tr style="background: #e8e8e8; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding-right: 15px;">TOTAL HOURS:</td>
                <td><strong>${totalHours.toFixed(2)}h</strong></td>
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
            return `
            <div class="session-entry">
              <div class="session-header-row">
                <span class="session-date">Day ${index + 1}: ${dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}</span>
                <span class="session-hours">${session.total_hours.toFixed(2)} hours</span>
              </div>
              
              <div class="session-detail-row">
                <span class="detail-label">Time In:</span>
                <span>${formatTimeOnly(session.start_time)}</span>
              </div>
              
              <div class="session-detail-row">
                <span class="detail-label">Time Out:</span>
                <span>${formatTimeOnly(session.end_time) || 'Ongoing'}</span>
              </div>
              
              ${session.description ? `
                <div class="session-detail-row">
                  <span class="detail-label">Work Description:</span>
                  <div class="detail-content">${session.description}</div>
                </div>
              ` : ''}
              
              ${session.tasks_completed ? `
                <div class="session-detail-row">
                  <span class="detail-label">Tasks Completed:</span>
                  <div class="detail-content">${session.tasks_completed}</div>
                </div>
              ` : ''}
              
              ${session.lessons_learned ? `
                <div class="session-detail-row">
                  <span class="detail-label">Lessons Learned:</span>
                  <div class="detail-content">${session.lessons_learned}</div>
                </div>
              ` : ''}
              
              ${session.report_images && session.report_images.length > 0 ? `
                <div class="session-detail-row">
                  <span class="detail-label">Attachments:</span>
                  <span>${session.report_images.length} supporting document${session.report_images.length > 1 ? 's' : ''}</span>
                </div>
              ` : ''}
            </div>
          `}).join('')}

          <!-- Signature Section -->
          <div class="signature-section">
            <p style="margin-bottom: 20px; font-size: 11pt;">
              I hereby certify that the information provided in this report is true and accurate to the best of my knowledge.
            </p>
            
            <div style="display: flex; justify-content: space-between; margin-top: 50px;">
              <div style="flex: 1; text-align: center;">
                <div class="signature-line">
                  <div class="signature-label">Trainee Signature</div>
                </div>
              </div>
              <div style="flex: 1; text-align: center;">
                <div class="signature-line">
                  <div class="signature-label">Supervisor Signature</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>OJT TRACKER SYSTEM</strong></p>
            <p>This is an official document generated by OJT Tracker - Professional Training Management System</p>
            <p>Document ID: OJT-${dateUtils.formatPH(new Date(), 'yyyyMMdd-HHmmss')}</p>
          </div>
        </body>
      </html>
    `
  }
}
