const geminiService = require('../services/geminiService');

const analyze = async (req, res, next) => {
  try {
    const { imageBase64, voiceTranscript } = req.body;
    const result = await geminiService.analyzeEmergency(imageBase64, voiceTranscript);
    res.status(200).json(result);
  } catch (error) {
    res.status(500);
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const { message, incidentContext } = req.body;
    
    if (!message || !incidentContext) {
      res.status(400);
      throw new Error('Message and incidentContext are required');
    }
    
    const result = await geminiService.getCrisisBotResponse(message, incidentContext);
    res.status(200).json({ reply: result });
  } catch (error) {
    res.status(500);
    next(error);
  }
};

module.exports = {
  analyze,
  chat
};
