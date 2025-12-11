import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Session } from '../types/models'
import { dateUtils } from '../utils/timezone'

export class PDFExportService {
  static async exportSession(session: Session): Promise<void> {
    const html = this.generateSessionHTML(session)
    
    const { uri } = await Print.printToFileAsync({ html })
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Session-${session.date}.pdf`,
      })
    }
  }

  static async exportMultipleSessions(sessions: Session[]): Promise<void> {
    const html = this.generateMultipleSessionsHTML(sessions)
    
    const { uri } = await Print.printToFileAsync({ html })
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `OJT-Report-${dateUtils.formatPH(new Date(), 'yyyy-MM-dd')}.pdf`,
      })
    }
  }

  private static generateSessionHTML(session: Session): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Session Report</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              color: #2c3e50;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #5865f2;
              padding-bottom: 20px;
            }
            h1 {
              color: #5865f2;
              margin: 0;
            }
            .subtitle {
              color: #7289da;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .section-title {
              color: #5865f2;
              font-weight: bold;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 8px 0;
              border-bottom: 1px solid #e3e5e8;
            }
            .label {
              font-weight: bold;
              color: #7289da;
            }
            .value {
              color: #2c3e50;
            }
            .content-text {
              line-height: 1.6;
              color: #2c3e50;
            }
            .break-item {
              padding: 8px;
              background: white;
              margin-bottom: 8px;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #95a5a6;
              font-size: 12px;
              border-top: 1px solid #e3e5e8;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 OJT Session Report</h1>
            <p class="subtitle">${dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}</p>
          </div>

          <div class="section">
            <div class="section-title">⏰ Time Information</div>
            <div class="info-row">
              <span class="label">Time In:</span>
              <span class="value">${dateUtils.formatPH(session.time_in, 'hh:mm:ss a')}</span>
            </div>
            <div class="info-row">
              <span class="label">Time Out:</span>
              <span class="value">${session.time_out ? dateUtils.formatPH(session.time_out, 'hh:mm:ss a') : 'Not ended'}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Hours:</span>
              <span class="value" style="font-size: 20px; font-weight: bold; color: #5865f2;">${session.total_hours.toFixed(2)}h</span>
            </div>
          </div>

          ${session.breaks.length > 0 ? `
            <div class="section">
              <div class="section-title">☕ Breaks (${session.breaks.length})</div>
              ${session.breaks.map((br, index) => `
                <div class="break-item">
                  <strong>Break ${index + 1}:</strong>
                  ${dateUtils.formatPH(br.start, 'hh:mm a')} - 
                  ${br.end ? dateUtils.formatPH(br.end, 'hh:mm a') : 'Ongoing'}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${session.tasks ? `
            <div class="section">
              <div class="section-title">📝 Tasks Completed</div>
              <p class="content-text">${session.tasks}</p>
            </div>
          ` : ''}

          ${session.lessons_learned ? `
            <div class="section">
              <div class="section-title">💡 Lessons Learned</div>
              <p class="content-text">${session.lessons_learned}</p>
            </div>
          ` : ''}

          ${session.notes ? `
            <div class="section">
              <div class="section-title">📌 Notes</div>
              <p class="content-text">${session.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Generated by OJT Tracker on ${dateUtils.formatPH(new Date(), 'MMMM dd, yyyy')}</p>
            <p>This is an official record of OJT hours completed</p>
          </div>
        </body>
      </html>
    `
  }

  private static generateMultipleSessionsHTML(sessions: Session[]): string {
    const totalHours = sessions.reduce((sum, s) => sum + s.total_hours, 0)
    const totalBreaks = sessions.reduce((sum, s) => sum + s.breaks.length, 0)
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>OJT Report</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              color: #2c3e50;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #5865f2;
              padding-bottom: 20px;
            }
            h1 {
              color: #5865f2;
              margin: 0;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin-bottom: 40px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .stat {
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #5865f2;
            }
            .stat-label {
              color: #7289da;
              font-size: 14px;
            }
            .session-card {
              margin-bottom: 20px;
              padding: 20px;
              background: white;
              border: 1px solid #e3e5e8;
              border-radius: 8px;
            }
            .session-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #5865f2;
            }
            .session-date {
              font-weight: bold;
              color: #5865f2;
            }
            .session-hours {
              font-size: 20px;
              font-weight: bold;
              color: #2c3e50;
            }
            .session-details {
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e3e5e8;
            }
            th {
              background: #5865f2;
              color: white;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #95a5a6;
              font-size: 12px;
              border-top: 1px solid #e3e5e8;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 OJT Comprehensive Report</h1>
            <p>${dateUtils.formatPH(new Date(), 'MMMM dd, yyyy')}</p>
          </div>

          <div class="summary">
            <div class="stat">
              <div class="stat-value">${sessions.length}</div>
              <div class="stat-label">Total Sessions</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalHours.toFixed(1)}h</div>
              <div class="stat-label">Total Hours</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalBreaks}</div>
              <div class="stat-label">Total Breaks</div>
            </div>
            <div class="stat">
              <div class="stat-value">${(totalHours / sessions.length).toFixed(1)}h</div>
              <div class="stat-label">Avg Hours/Day</div>
            </div>
          </div>

          <h2 style="color: #5865f2; margin-bottom: 20px;">📅 Session History</h2>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Hours</th>
                <th>Breaks</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(session => `
                <tr>
                  <td>${dateUtils.formatPH(session.date, 'MMM dd, yyyy')}</td>
                  <td>${dateUtils.formatPH(session.time_in, 'hh:mm a')}</td>
                  <td>${session.time_out ? dateUtils.formatPH(session.time_out, 'hh:mm a') : '-'}</td>
                  <td><strong>${session.total_hours.toFixed(2)}h</strong></td>
                  <td>${session.breaks.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="page-break-before: always;"></div>

          <h2 style="color: #5865f2; margin: 40px 0 20px;">📝 Detailed Logs</h2>

          ${sessions.map(session => `
            <div class="session-card">
              <div class="session-header">
                <div class="session-date">
                  ${dateUtils.formatPH(session.date, 'EEEE, MMMM dd, yyyy')}
                </div>
                <div class="session-hours">${session.total_hours.toFixed(2)}h</div>
              </div>
              
              ${session.tasks ? `
                <div class="session-details">
                  <strong style="color: #5865f2;">Tasks:</strong>
                  <p>${session.tasks}</p>
                </div>
              ` : ''}
              
              ${session.lessons_learned ? `
                <div class="session-details">
                  <strong style="color: #5865f2;">Lessons:</strong>
                  <p>${session.lessons_learned}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}

          <div class="footer">
            <p><strong>OJT Tracker</strong> - Professional Time Tracking System</p>
            <p>Generated on ${dateUtils.formatPH(new Date(), 'MMMM dd, yyyy hh:mm a')}</p>
            <p>This document serves as official proof of completed OJT hours</p>
          </div>
        </body>
      </html>
    `
  }
}