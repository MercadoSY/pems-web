// src/utils/prescriptiveAnalysis.js
import { predictNext24Hours } from './predictiveAnalysis';

/**
 * Fetches recent data from ThingSpeak for predictive analysis.
 * @param {object} channelConfig - The ThingSpeak channel configuration.
 * @returns {Promise<object>} A promise that resolves to the fetched data.
 */
const fetchPredictionData = async (channelConfig) => {
    try {
        // Fetch last 3 hours of data for a recent trend analysis.
        // Approx. 3 hours * 60 mins/hr * 4 readings/min = 720 readings. Fetch 800 to be safe.
        const response = await fetch(`https://api.thingspeak.com/channels/${channelConfig.ID}/feeds.json?api_key=${channelConfig.ReadAPI}&results=800`);
        if (!response.ok) return { ammonia: null, temp: null };
        const data = await response.json();
        const feeds = data.feeds || [];

        const ammoniaField = channelConfig.AmmoniaField || 'field3';
        const tempField = channelConfig.TempField || 'field1';

        const ammoniaData = feeds.map(feed => ({ created_at: feed.created_at, value: parseFloat(feed[ammoniaField]) }));
        const tempData = feeds.map(feed => ({ created_at: feed.created_at, value: parseFloat(feed[tempField]) }));
        
        return { ammonia: ammoniaData, temp: tempData };
    } catch (error) {
        console.error("Error fetching data for prediction:", error);
        return { ammonia: null, temp: null };
    }
};

/**
 * Generates a prescriptive analysis with recommended actions.
 * @param {object} alert - The alert object.
 * @param {object} channelConfig - The configuration for the poultry house's channel.
 * @param {object} diagnostic - The diagnostic analysis result.
 * @returns {Promise<object>} A promise that resolves to an object with prescriptive insights.
 */
export const generatePrescriptiveAnalysis = async (alert, channelConfig, diagnostic) => {
    if (!alert || !channelConfig) return { title: 'Recommendation Error', recommendations: ['Missing data for analysis.'] };
    
    const { type } = alert;
    const predictionData = await fetchPredictionData(channelConfig);
    let recommendations = [];
    let title = 'Recommended Actions';

    const isAmmoniaAlert = type.toLowerCase().includes('ammonia');
    const isTempAlert = type.toLowerCase().includes('temperature');

    if (isAmmoniaAlert && predictionData.ammonia) {
        const prediction = predictNext24Hours(predictionData.ammonia);
        if (prediction && prediction.trend === 'increasing') {
            recommendations.push({ text: 'Improve airflow immediately.', priority: 'high' });
            recommendations.push({ text: 'Check and clean animal waste.', priority: 'high' });
        }
    }

    if (isTempAlert && predictionData.temp) {
        const prediction = predictNext24Hours(predictionData.temp);
        const isHighTemp = alert.message.toLowerCase().includes('high');

        if (prediction) {
            if (prediction.trend === 'increasing' && isHighTemp) {
                recommendations.push({ text: 'Activate cooling systems now.', priority: 'high' });
                recommendations.push({ text: 'Ensure water sources are full and accessible.', priority: 'high' });
            } else if (prediction.trend === 'decreasing' && !isHighTemp) {
                recommendations.push({ text: 'Activate heating systems.', priority: 'high' });
                recommendations.push({ text: 'Check for and seal any drafts.', priority: 'high' });
            }
        }
    }
    
    // Default recommendations based on alert type
    if (isAmmoniaAlert) {
        recommendations.push({ text: 'Clean animal waste.', priority: 'medium' });
        recommendations.push({ text: 'Check feed and water quality.', priority: 'low' });
    }

    if (isTempAlert) {
        const isHighTemp = alert.message.toLowerCase().includes('high');
        if (isHighTemp) {
            recommendations.push({ text: 'Improve airflow.', priority: 'medium' });
            recommendations.push({ text: 'Increase water supply.', priority: 'medium' });
        } else {
            recommendations.push({ text: 'Activate heating system.', priority: 'medium' });
        }
    }
    
    // Refine recommendations based on diagnostics
    if (diagnostic.insights.some(insight => insight.includes('recurring'))) {
        if(isAmmoniaAlert) recommendations.push({ text: 'Review and improve animal waste management schedule.', priority: 'long-term' });
        if(isTempAlert) recommendations.push({ text: 'Schedule climate control system maintenance.', priority: 'long-term' });
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = Array.from(new Map(recommendations.map(item => [item.text, item])).values());
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3, 'long-term': 4 };
    uniqueRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    const finalRecommendations = uniqueRecommendations.map(rec => rec.text);
    
    return { title, recommendations: finalRecommendations };
};