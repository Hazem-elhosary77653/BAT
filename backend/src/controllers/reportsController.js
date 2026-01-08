const pool = require('../db/connection');
const { logAuditAction } = require('../utils/audit');

// Generate report
const generateReport = async (req, res) => {
  try {
    const { title, reportType, filters } = req.body;

    // Fetch data based on report type
    let reportData = {};

    if (reportType === 'user_stories') {
      const result = await pool.query(
        `SELECT status, COUNT(*) as count FROM user_stories WHERE user_id = $1 GROUP BY status`,
        [req.user.id]
      );
      reportData = result.rows;
    } else if (reportType === 'brds') {
      const result = await pool.query(
        `SELECT status, COUNT(*) as count FROM brds WHERE user_id = $1 GROUP BY status`,
        [req.user.id]
      );
      reportData = result.rows;
    } else if (reportType === 'analytics') {
      const storiesCount = await pool.query(
        `SELECT COUNT(*) as count FROM user_stories WHERE user_id = $1`,
        [req.user.id]
      );
      const brdsCount = await pool.query(
        `SELECT COUNT(*) as count FROM brds WHERE user_id = $1`,
        [req.user.id]
      );
      const docsCount = await pool.query(
        `SELECT COUNT(*) as count FROM documents WHERE user_id = $1`,
        [req.user.id]
      );
      reportData = {
        totalUserStories: storiesCount.rows[0].count,
        totalBRDs: brdsCount.rows[0].count,
        totalDocuments: docsCount.rows[0].count
      };
    }

    const result = await pool.query(
      `INSERT INTO reports (user_id, title, report_type, report_data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, title, reportType, JSON.stringify(reportData)]
    );

    await logAuditAction(req.user.id, 'REPORT_GENERATED', 'report', result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Get reports
const getReports = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

// Get report by ID
const getReportById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reports WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

// Export report
const exportReport = async (req, res) => {
  try {
    const { format } = req.query;
    const result = await pool.query(
      `SELECT * FROM reports WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    if (format === 'pdf') {
      res.json({ message: 'PDF export functionality would be implemented here', report });
    } else if (format === 'excel') {
      res.json({ message: 'Excel export functionality would be implemented here', report });
    } else {
      res.json(report);
    }
  } catch (err) {
    console.error('Error exporting report:', err);
    res.status(500).json({ error: 'Failed to export report' });
  }
};

module.exports = {
  generateReport,
  getReports,
  getReportById,
  exportReport
};
