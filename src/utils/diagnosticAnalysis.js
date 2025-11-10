// src/utils/diagnosticAnalysis.js

/**
 * Analyzes historical alerts to find patterns.
 * @param {object} currentAlert - The alert being analyzed.
 * @param {Array} allAlerts - All historical alerts for the specific poultry house.
 * @returns {object} Patterns like recurrence and ineffective actions.
 */
const analyzeHistoricalPatterns = (currentAlert, allAlerts) => {
    const thirtyDaysAgo = new Date(currentAlert.timestampDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const similarAlerts = allAlerts.filter(a =>
        a.firestoreId === currentAlert.firestoreId &&
        a.type === currentAlert.type &&
        a.timestampDate < currentAlert.timestampDate &&
        a.timestampDate >= thirtyDaysAgo
    ).sort((a, b) => b.timestampDate - a.timestampDate);

    const recurrence = {
        isRecurrent: similarAlerts.length > 0,
        count: similarAlerts.length,
        lastOccurrence: similarAlerts.length > 0 ? similarAlerts[0].timestampDate : null,
    };

    // Find actions that were taken for similar alerts but didn't prevent recurrence.
    const ineffectiveActions = new Set();
    if (recurrence.isRecurrent) {
        similarAlerts.slice(0, 3).forEach(alert => { // Check last 3 similar alerts
            if (alert.actionTaken && alert.actionTaken.length > 0) {
                alert.actionTaken.forEach(action => ineffectiveActions.add(action));
            }
        });
    }

    return { recurrence, ineffectiveActions: Array.from(ineffectiveActions) };
};


/**
 * Generates a diagnostic analysis for a given alert.
 * @param {object} alert - The alert object.
 * @param {Array} allUserAlerts - A list of all alerts for context.
 * @returns {object} An object containing a title and diagnostic insights.
 */
export const generateDiagnosticAnalysis = (alert, allUserAlerts) => {
    if (!alert) {
        console.error("generateDiagnosticAnalysis called with invalid alert data.");
        return { title: 'Analysis Error', insights: ['Invalid alert data provided.'] };
    }
    // Log key information for debugging diagnostic generation.
    if (process.env.NODE_ENV !== 'production') {
        console.log(`Generating diagnostic for alert type: ${alert.type} in house: ${alert.firestoreId}`);
    }

    const { type, message, timestampDate } = alert;
    const historicalAlerts = allUserAlerts.filter(a => a.firestoreId === alert.firestoreId);
    const { recurrence, ineffectiveActions } = analyzeHistoricalPatterns(alert, historicalAlerts);
    
    let insights = [];
    const alertValue = parseFloat(message.match(/(\d+\.?\d*)/)?.[0] || "0");
    const hour = timestampDate.getHours();

    // Base Title
    let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Alert`;

    // Common factor analysis
    if (recurrence.isRecurrent) {
        insights.push(`This is a **repeated alert**. It happened ${recurrence.count} time(s) in the past 30 days.`);
    }

    if (type.toLowerCase().includes('ammonia')) {
        insights.push(`High ammonia (**${alertValue} PPM**) is often caused by animal waste or poor airflow.`);
        if (hour >= 20 || hour <= 6) { // Evening/Night
            insights.push(`Happened at night. Cool air and less fan activity can trap ammonia.`);
        }
        if (ineffectiveActions.includes('Improved airflow')) {
            insights.push(`Just improving airflow didn't fix this before. The problem might be **animal waste** or **too many animals**.`);
        }
    } else if (type.toLowerCase().includes('temperature')) {
        const isHighTemp = message.toLowerCase().includes('high');
        title = `${isHighTemp ? 'High' : 'Low'} Temperature Alert`;
        
        if (isHighTemp) {
            insights.push(`High temperature (**${alertValue}°C**) suggests a cooling problem or very hot weather outside.`);
            if (hour >= 12 && hour <= 16) { // Afternoon
                insights.push(`Happened in the afternoon, the hottest time of day.`);
            }
            if (ineffectiveActions.includes('Activated cooling system')) {
                insights.push(`Using the cooling system didn't prevent this alert before. The system may be **weak** or the airflow is poor.`);
            }
        } else { // Low Temp
            insights.push(`Low temperature (**${alertValue}°C**) points to a heater problem or cold drafts.`);
            if (hour >= 22 || hour <= 5) { // Late Night/Early Morning
                insights.push(`Happened overnight when it's naturally colder.`);
            }
            if (ineffectiveActions.includes('Activated heating system')) {
                insights.push(`Using the heater didn't prevent this alert before. It may need a **check-up or repair**.`);
            }
        }
    } else {
        insights.push('General alert. Check all systems.');
    }

    return { title, insights };
};