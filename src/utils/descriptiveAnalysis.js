import { mean, min, max, standardDeviation, linearRegression } from 'simple-statistics';

// Converts Celsius to Fahrenheit.
const cToF = c => c * 9 / 5 + 32;

// Calculates core statistics from a set of [index, value] points.
const calculateStatistics = (points) => {
  if (points.length === 0) {
    return { mean: null, min: null, max: null, stdDev: null, trend: 'stable', count: 0 };
  }

  const values = points.map(([, value]) => value);

  if (points.length < 2) {
    const singleValue = values[0];
    return { mean: singleValue, min: singleValue, max: singleValue, stdDev: 0, trend: 'stable', count: 1 };
  }

  const { m: slope } = linearRegression(points);

  let trend = 'stable';
  if (slope > 0.05) trend = 'increasing';
  if (slope < -0.05) trend = 'decreasing';

  return {
    mean: mean(values),
    min: min(values),
    max: max(values),
    stdDev: standardDeviation(values),
    trend,
    count: values.length
  };
};

// Calculates statistics for dashboard data (array of objects with 'value' property).
const getStats = (data) => {
  const points = (data || [])
    .map((p, i) => [i, p.value])
    .filter(([, value]) => value !== null && !isNaN(value));
  return calculateStatistics(points);
};

// Calculates statistics for report chart data (simple array of values).
export const getChartStats = (dataPoints) => {
    const points = (dataPoints || [])
        .map((p, i) => [i, p])
        .filter(([, value]) => value !== null && !isNaN(value));
    return calculateStatistics(points);
};

// Generates a comprehensive, categorized set of insights for the dashboard.
export const generateInsights = (params) => {
    const { channel, daily, weekly, monthly, hourlyAmmonia, hourlyTemp, annualData, alerts } = params;
    if (!channel) return null;

    const thresholds = {
      ammoniaHigh: parseFloat(channel.alertThreshold?.ammoniaHigh),
      tempHigh: parseFloat(channel.alertThreshold?.tempHigh),
      tempLow: parseFloat(channel.alertThreshold?.tempLow),
    };

    let insights = {
      daily: { title: 'Daily Summary', icon: 'bi-sun', color: '#fd7e14', insights: [] },
      weekly: { title: 'Weekly Trends', icon: 'bi-graph-up', color: '#0dcaf0', insights: [] },
      monthly: { title: 'This Month At a Glance', icon: 'bi-calendar-check', color: '#6f42c1', insights: [] },
      annual: { title: 'Annual Overview', icon: 'bi-calendar3', color: '#198754', insights: [] },
      hourly: { title: 'Hourly Patterns', icon: 'bi-clock-history', color: '#d63384', insights: [] },
      alerts: { title: 'Alert Analysis', icon: 'bi-exclamation-triangle', color: '#dc3545', insights: [] }
    };

    // --- Daily Analysis ---
    const dailyAmmoniaStats = getStats(daily.ammonia);
    const dailyTempStats = getStats(daily.temp);
    if (dailyAmmoniaStats.count > 0) {
      if (!isNaN(thresholds.ammoniaHigh) && dailyAmmoniaStats.max >= thresholds.ammoniaHigh) {
        insights.daily.insights.push({ text: `Ammonia peaked at **${dailyAmmoniaStats.max.toFixed(2)} ppm**, exceeding the **${thresholds.ammoniaHigh} ppm** threshold.`, icon: 'bi-exclamation-circle-fill' });
      } else {
        insights.daily.insights.push({ text: `Average ammonia in the last 24h was **${dailyAmmoniaStats.mean.toFixed(2)} ppm**.`, icon: 'bi-wind' });
      }
    }
    if (dailyTempStats.count > 0) {
      if (!isNaN(thresholds.tempHigh) && dailyTempStats.max >= thresholds.tempHigh) {
        insights.daily.insights.push({ text: `Temperature hit a high of **${dailyTempStats.max.toFixed(2)}°C**, exceeding the **${thresholds.tempHigh}°C** limit.`, icon: 'bi-thermometer-high' });
      } else if (!isNaN(thresholds.tempLow) && dailyTempStats.min <= thresholds.tempLow) {
        insights.daily.insights.push({ text: `Temperature dropped to **${dailyTempStats.min.toFixed(2)}°C**, below the **${thresholds.tempLow}°C** limit.`, icon: 'bi-thermometer-low' });
      } else {
        insights.daily.insights.push({ text: `Temperature ranged from **${dailyTempStats.min.toFixed(2)}°C** to **${dailyTempStats.max.toFixed(2)}°C**.`, icon: 'bi-thermometer-half' });
      }
      if (dailyTempStats.stdDev > 2) {
          insights.daily.insights.push({ text: `Temperature was **volatile**, fluctuating by ~**${dailyTempStats.stdDev.toFixed(1)}°C** from the average.`, icon: 'bi-activity' });
      }
    }
    if (dailyAmmoniaStats.count === 0 && dailyTempStats.count === 0) insights.daily.insights.push({ text: "No new data recorded in the last 24 hours.", icon: 'bi-info-circle' });

    // --- Weekly Analysis ---
    const weeklyAmmoniaStats = getStats(weekly.ammonia);
    const weeklyTempStats = getStats(weekly.temp);
    if (weeklyAmmoniaStats.count > 0) {
      const trendIcon = weeklyAmmoniaStats.trend === 'increasing' ? 'bi-arrow-up-right' : weeklyAmmoniaStats.trend === 'decreasing' ? 'bi-arrow-down-right' : 'bi-check-circle';
      insights.weekly.insights.push({ text: `Ammonia levels showed a **${weeklyAmmoniaStats.trend}** trend this week.`, icon: trendIcon });
    }
    if (weeklyTempStats.count > 0) {
        const trendIcon = weeklyTempStats.trend === 'increasing' ? 'bi-arrow-up-right' : weeklyTempStats.trend === 'decreasing' ? 'bi-arrow-down-right' : 'bi-check-circle';
        insights.weekly.insights.push({ text: `Temperature showed a **${weeklyTempStats.trend}** trend this week.`, icon: trendIcon });
    }
    if (weeklyAmmoniaStats.count < 2 && weeklyTempStats.count < 2) {
        insights.weekly.insights.push({ text: "Not enough data for weekly trend analysis.", icon: 'bi-info-circle' });
    }
    
    // --- Monthly Analysis ---
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
    const currentMonthData = annualData.find(d => d.month === currentMonthName);
    if (currentMonthData && currentMonthData.ammoniaAvg) insights.monthly.insights.push({ text: `This month's average ammonia is **${currentMonthData.ammoniaAvg} ppm**.`, icon: 'bi-wind' });
    if (currentMonthData && currentMonthData.tempAvg) insights.monthly.insights.push({ text: `The average temperature this month is **${currentMonthData.tempAvg}°C**.`, icon: 'bi-thermometer-half' });

    // --- Annual Analysis (based on annual report) ---
    const validMonths = annualData.filter(d => d.ammoniaAvg && d.tempAvg);
    if (validMonths.length > 1) {
        const hottestMonth = validMonths.reduce((max, month) => parseFloat(month.tempAvg) > parseFloat(max.tempAvg) ? month : max);
        insights.annual.insights.push({ text: `**${hottestMonth.month}** was the hottest month on average (**${hottestMonth.tempAvg}°C**).`, icon: 'bi-thermometer-sun' });
        
        const highestAmmoniaMonth = validMonths.reduce((max, month) => parseFloat(month.ammoniaAvg) > parseFloat(max.ammoniaAvg) ? month : max);
        insights.annual.insights.push({ text: `Ammonia levels were highest in **${highestAmmoniaMonth.month}** (**${highestAmmoniaMonth.ammoniaAvg} ppm**).`, icon: 'bi-wind' });
    }

    // --- Hourly Analysis ---
    const validHourlyAmmonia = Object.entries(hourlyAmmonia || {}).filter(([_,v]) => v !== null && !isNaN(v));
    if (validHourlyAmmonia.length > 0) {
        const [peakHour] = validHourlyAmmonia.reduce((max, entry) => parseFloat(entry[1]) > parseFloat(max[1]) ? entry : max, ['', -Infinity]);
        insights.hourly.insights.push({ text: `Ammonia levels typically peak around **${peakHour}**.`, icon: 'bi-clock' });
    }
    const validHourlyTemp = Object.entries(hourlyTemp || {}).filter(([_,v]) => v !== null && !isNaN(v));
    if (validHourlyTemp.length > 0) {
        const [peakHour] = validHourlyTemp.reduce((max, entry) => parseFloat(entry[1]) > parseFloat(max[1]) ? entry : max, ['', -Infinity]);
        insights.hourly.insights.push({ text: `The warmest part of the day is usually around **${peakHour}**.`, icon: 'bi-clock-fill' });
    }

    // --- Alert Analysis ---
    const oneMonthAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const recentAlerts = alerts.filter(a => a.timestampDate >= oneMonthAgo);
    if (recentAlerts.length > 0) {
        insights.alerts.insights.push({ text: `Triggered **${recentAlerts.length}** alert(s) in the last 30 days.`, icon: 'bi-bell-fill' });
        const alertTypeCounts = recentAlerts.reduce((acc, alert) => { acc[alert.type] = (acc[alert.type] || 0) + 1; return acc; }, {});
        const mostCommonType = Object.keys(alertTypeCounts).reduce((a, b) => alertTypeCounts[a] > alertTypeCounts[b] ? a : b);
        insights.alerts.insights.push({ text: `The most frequent alert type was **'${mostCommonType}'**.`, icon: 'bi-bar-chart-fill' });
    } else {
        insights.alerts.insights.push({ text: "No critical alerts have been triggered in the past 30 days.", icon: 'bi-shield-check' });
    }
    
    Object.keys(insights).forEach(key => { if (insights[key].insights.length === 0) delete insights[key]; });
    return Object.keys(insights).length > 0 ? insights : null;
};

// --- Report Generation Analysis Functions ---

// Generates analysis text for line charts in reports.
export function analyzeLineChartData(dataPoints, metric, unit, tempUnit = 'C') {
    const stats = getChartStats(dataPoints);
    if (stats.count < 2) {
        return [{ text: 'Trend Analysis:\n', type: 'bold' }, { text: 'Not enough data for a detailed trend analysis.', type: 'normal' }];
    }
    
    const isTempF = tempUnit === 'F' && metric === 'temperature';
    const displayUnit = isTempF ? '°F' : unit;
    const convert = val => (isTempF && !isNaN(val)) ? cToF(val) : val;

    const trendText = stats.trend !== 'stable' ? `an ${stats.trend}` : 'a stable';
    
    return [
        { text: 'Trend Analysis:\n', type: 'bold' },
        { text: `This month showed ${trendText} trend for ${metric}. `, type: 'normal' },
        { text: `The average was ${convert(stats.mean).toFixed(2)}${displayUnit}`, type: 'bold' },
        { text: `, with a recorded high of ${convert(stats.max).toFixed(2)}${displayUnit} and a low of ${convert(stats.min).toFixed(2)}${displayUnit}.`, type: 'normal' },
    ];
}

// Generates analysis text for bar charts in reports.
export function analyzeBarChartData(dataPoints, unit, tempUnit = 'C', metric = '') {
    const validPoints = dataPoints.map((p, i) => ({ hour: i, value: p }))
                                  .filter(p => p.value !== null && !isNaN(p.value));
    if (validPoints.length === 0) {
        return [{ text: 'Hourly Pattern:\n', type: 'bold' }, { text: 'No hourly data was available to identify daily patterns.', type: 'normal' }];
    }
    const peak = validPoints.reduce((p, c) => (c.value > p.value ? c : p));
    const peakHour = `${String(peak.hour).padStart(2, '0')}:00`;

    const isTempF = tempUnit === 'F' && metric === 'temperature';
    const displayUnit = isTempF ? '°F' : unit;
    const convert = val => (isTempF && !isNaN(val)) ? cToF(val) : val;
    
    return [
        { text: 'Hourly Pattern:\n', type: 'bold' },
        { text: `Levels typically peaked around `, type: 'normal' },
        { text: `${peakHour} at approximately ${convert(peak.value).toFixed(2)}${displayUnit}`, type: 'bold' },
        { text: ', suggesting a consistent daily cycle.', type: 'normal' }
    ];
}

// Generates a high-level summary for monthly reports.
export function generateOverallSummary(summary, thresholds, ammoniaStats, tempStats) {
    const tempAvg = parseFloat(summary.tempSummary.avg);
    const ammoniaAvg = parseFloat(summary.ammoniaSummary.avg);

    const issues = [];
    if (thresholds?.ammoniaHigh && !isNaN(thresholds.ammoniaHigh) && ammoniaAvg > parseFloat(thresholds.ammoniaHigh)) {
        issues.push("high ammonia levels");
    }
    if (thresholds?.tempHigh && !isNaN(thresholds.tempHigh) && tempAvg > parseFloat(thresholds.tempHigh)) {
        issues.push("high temperatures");
    }
    if (thresholds?.tempLow && !isNaN(thresholds.tempLow) && tempAvg < parseFloat(thresholds.tempLow)) {
        issues.push("low temperatures");
    }

    let safety = "Overall, conditions were stable and within safe limits this month.";
    if (issues.length > 0) {
        safety = `Environmental metrics were outside recommended thresholds, specifically ${issues.join(' and ')}, suggesting a need for closer monitoring.`;
    }

    const ammoniaTrend = ammoniaStats.count > 1 ? ammoniaStats.trend : 'stable';
    const tempTrend = tempStats.count > 1 ? tempStats.trend : 'stable';

    return [
        { text: 'This report summarizes the environmental conditions for the month. ', type: 'normal' },
        { text: `Ammonia levels showed a ${ammoniaTrend} trend, while temperature showed a ${tempTrend} trend.\n\n`, type: 'normal' },
        { text: 'Safety Note: ', type: 'bold' },
        { text: safety, type: 'normal' },
    ];
}

// Generates analysis text for the annual table in reports.
export function analyzeAnnualTableData(annualData, thresholds, tempUnit = 'C') {
    const validMonths = annualData.filter(d => d.tempAvg && d.ammoniaAvg && !isNaN(parseFloat(d.tempAvg)) && !isNaN(parseFloat(d.ammoniaAvg)));
    if (validMonths.length < 2) {
        return [
            { text: 'This table summarizes available monthly data for the year. ', type: 'normal' },
            { text: 'More data is needed for a full annual trend analysis.', type: 'bold' }
        ];
    }
    const hottestMonth = validMonths.reduce((max, month) => parseFloat(month.tempAvg) > parseFloat(max.tempAvg) ? month : max);
    const highestAmmoniaMonth = validMonths.reduce((max, month) => parseFloat(month.ammoniaAvg) > parseFloat(max.ammoniaAvg) ? month : max);

    let safetyText = "Throughout the year, the monthly average conditions remained largely within safe operational thresholds.";
    if (thresholds) {
        const monthsOverAmmonia = validMonths.filter(m => parseFloat(m.ammoniaAvg) > parseFloat(thresholds.ammoniaHigh)).length;
        const monthsOverTemp = validMonths.filter(m => parseFloat(m.tempAvg) > parseFloat(thresholds.tempHigh)).length;
        if (monthsOverAmmonia > 1 || monthsOverTemp > 1) {
            safetyText = "Several months experienced average conditions that exceeded safety thresholds, particularly during warmer periods.";
        }
    }
    
    const isF = tempUnit === 'F';
    const tempUnitSymbol = isF ? '°F' : '°C';
    const convert = val => isF ? cToF(parseFloat(val)).toFixed(1) : val;

    return [
        { text: 'Yearly Patterns:\n', type: 'bold' },
        { text: `The warmest month was ${hottestMonth.month} (${convert(hottestMonth.tempAvg)}${tempUnitSymbol}), while ammonia levels were highest in ${highestAmmoniaMonth.month} (${highestAmmoniaMonth.ammoniaAvg} ppm).\n\n`, type: 'normal' },
        { text: 'Overall Safety: ', type: 'bold' },
        { text: safetyText, type: 'normal' }
    ];
}