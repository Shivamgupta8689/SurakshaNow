const geminiService = require('../services/geminiService');

const generateReport = async (req, res, next) => {
  try {
    const { incidents } = req.body;
    
    if (!incidents || !Array.isArray(incidents)) {
      res.status(400);
      throw new Error('An array of incidents is required');
    }
    
    const result = await geminiService.generateIncidentReport(incidents);
    res.status(200).json({ report: result });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = {
  generateReport
};
