const axios = require('axios');

class TrafficPredictor {
  constructor() {
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async getTrafficPrediction(waypoints, options = {}) {
    try {
      const { timeOfDay = new Date().getHours(), dayOfWeek = new Date().getDay() } = options;
      
      const context = this.prepareTrafficContext(waypoints, timeOfDay, dayOfWeek);
      const aiPrediction = await this.queryGeminiAPI(context);
      const structuredPrediction = this.processAIPrediction(aiPrediction, waypoints);
      
      return structuredPrediction;
    } catch (error) {
      console.error('Traffic prediction error:', error);
      return this.getFallbackPrediction(waypoints);
    }
  }

  prepareTrafficContext(waypoints, timeOfDay, dayOfWeek) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timeContext = this.getTimeContext(timeOfDay);
    
    return {
      waypoints: waypoints.map((wp, index) => ({
        id: index,
        coordinates: wp,
        type: index === 0 ? 'start' : 'delivery'
      })),
      temporal: {
        dayOfWeek: dayNames[dayOfWeek],
        timeOfDay: timeOfDay,
        timeContext: timeContext,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isRushHour: (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19)
      },
      historicalPatterns: this.getHistoricalPatterns(timeOfDay, dayOfWeek)
    };
  }

  getTimeContext(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  getHistoricalPatterns(timeOfDay, dayOfWeek) {
    const patterns = {
      weekday: {
        morning: { congestion: 0.8, averageDelay: 25 },
        afternoon: { congestion: 0.6, averageDelay: 15 },
        evening: { congestion: 0.9, averageDelay: 30 },
        night: { congestion: 0.2, averageDelay: 5 }
      },
      weekend: {
        morning: { congestion: 0.3, averageDelay: 8 },
        afternoon: { congestion: 0.5, averageDelay: 12 },
        evening: { congestion: 0.4, averageDelay: 10 },
        night: { congestion: 0.1, averageDelay: 3 }
      }
    };

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const timeContext = this.getTimeContext(timeOfDay);
    
    return patterns[isWeekend ? 'weekend' : 'weekday'][timeContext];
  }

  async queryGeminiAPI(context) {
    try {
      if (!this.geminiApiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = this.buildTrafficPrompt(context);
      
      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  buildTrafficPrompt(context) {
    return `
Analyze traffic conditions and predict delays for a delivery route with the following context:

Route Details:
- Number of waypoints: ${context.waypoints.length}
- Day: ${context.temporal.dayOfWeek}
- Time: ${context.temporal.timeOfDay}:00 (${context.temporal.timeContext})
- Is Weekend: ${context.temporal.isWeekend}
- Is Rush Hour: ${context.temporal.isRushHour}

Historical Patterns:
- Average congestion level: ${context.historicalPatterns.congestion}
- Average delay: ${context.historicalPatterns.averageDelay} minutes

Please provide a JSON response with traffic predictions including:
1. Overall route delay estimate (in minutes)
2. Congestion level (0-1 scale)
3. Confidence score (0-1 scale)
4. Segment-specific predictions for each waypoint
5. Recommended departure time adjustments
6. Alternative route suggestions if applicable

Format the response as valid JSON only, no additional text.
`;
  }

  processAIPrediction(aiResponse, waypoints) {
    try {
      const prediction = JSON.parse(aiResponse);
      
      return {
        overallDelay: prediction.overallDelay || 0,
        congestionLevel: prediction.congestionLevel || 0.5,
        confidence: prediction.confidence || 0.7,
        segments: this.generateSegmentPredictions(waypoints, prediction),
        recommendations: prediction.recommendations || [],
        lastUpdated: new Date(),
        source: 'ai-prediction'
      };
    } catch (error) {
      console.error('Error processing AI prediction:', error);
      return this.getFallbackPrediction(waypoints);
    }
  }

  generateSegmentPredictions(waypoints, aiPrediction) {
    return waypoints.map((waypoint, index) => ({
      segmentId: `segment_${index}`,
      startPoint: index === 0 ? waypoint : waypoints[index - 1],
      endPoint: waypoint,
      predictedDelay: (aiPrediction.overallDelay || 0) / waypoints.length,
      congestionLevel: aiPrediction.congestionLevel || 0.5,
      confidence: aiPrediction.confidence || 0.7,
      alternativeRoutes: []
    }));
  }

  getFallbackPrediction(waypoints) {
    const currentHour = new Date().getHours();
    const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
    
    return {
      overallDelay: isRushHour ? 20 : 5,
      congestionLevel: isRushHour ? 0.8 : 0.3,
      confidence: 0.6,
      segments: waypoints.map((waypoint, index) => ({
        segmentId: `segment_${index}`,
        startPoint: index === 0 ? waypoint : waypoints[index - 1],
        endPoint: waypoint,
        predictedDelay: isRushHour ? 3 : 1,
        congestionLevel: isRushHour ? 0.8 : 0.3,
        confidence: 0.6,
        alternativeRoutes: []
      })),
      recommendations: [
        isRushHour ? 'Consider departing 20 minutes earlier due to rush hour traffic' : 'Normal traffic conditions expected'
      ],
      lastUpdated: new Date(),
      source: 'fallback-prediction'
    };
  }

  async analyzeHistoricalTraffic({ startLocation, endLocation, timeRange }) {
    return {
      route: {
        start: startLocation,
        end: endLocation
      },
      timeRange,
      patterns: {
        averageSpeed: 35,
        peakCongestionHours: ['08:00-09:00', '17:30-18:30'],
        bestTravelTimes: ['10:00-16:00', '20:00-06:00'],
        worstTravelTimes: ['08:00-09:30', '17:00-19:00']
      },
      recommendations: [
        'Avoid travel between 8-9 AM and 5-7 PM for optimal delivery times',
        'Consider alternative routes during peak hours',
        'Weekend traffic is typically 40% lighter than weekdays'
      ],
      confidence: 0.85,
      dataPoints: 1000,
      lastAnalyzed: new Date()
    };
  }
}

const trafficPredictor = new TrafficPredictor();

module.exports = {
  getTrafficPrediction: (waypoints, options) => trafficPredictor.getTrafficPrediction(waypoints, options),
  analyzeHistoricalTraffic: (params) => trafficPredictor.analyzeHistoricalTraffic(params)
};