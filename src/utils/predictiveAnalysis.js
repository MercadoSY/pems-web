// src/utils/predictiveAnalysis.js
import { linearRegression } from 'simple-statistics';

// Predicts the next value in a time series using linear regression for the next 24 hours.
export const predictNext24Hours = (dataPoints) => {
  if (!dataPoints || dataPoints.length < 10) {
    return null; // Not enough data for a meaningful prediction
  }

  // Use up to the last 7 days of data for prediction to focus on recent trends.
  const relevantPoints = dataPoints.slice(-168); // Approx 7 days of hourly data (7*24)

  const formattedPoints = relevantPoints
    .map(p => ({
      // Convert time to a numerical value (hours since epoch) for regression
      timestamp: new Date(p.created_at).getTime() / (1000 * 3600),
      value: p.value,
    }))
    .filter(p => !isNaN(p.timestamp) && p.value !== null && !isNaN(p.value));

  if (formattedPoints.length < 10) {
    return null; // Ensure there are still enough valid points after filtering
  }

  const regressionPoints = formattedPoints.map(p => [p.timestamp, p.value]);
  const { m: slope, b: intercept } = linearRegression(regressionPoints);

  // Predict the value 24 hours from the last data point's timestamp
  const lastTimestamp = regressionPoints[regressionPoints.length - 1][0];
  const nextTimestamp = lastTimestamp + 24;
  const predictedValue = Math.max(0, slope * nextTimestamp + intercept); // Ensure prediction is not negative

  // Determine the trend based on the slope. A larger threshold makes it less sensitive.
  let trend = 'stable';
  const twentyFourHourChange = slope * 24;
  if (twentyFourHourChange > 0.5) trend = 'increasing';
  if (twentyFourHourChange < -0.5) trend = 'decreasing';

  return { predictedValue, trend };
};

// Predicts the next value in a time series using linear regression for the next 7 days.
export const predictNext7Days = (dataPoints) => {
  if (!dataPoints || dataPoints.length < 20) {
    return null; // Not enough data for a longer-term prediction
  }

  // Use up to the last 30 days of data for weekly prediction.
  const relevantPoints = dataPoints.slice(-720); // Approx 30 days of hourly data (30*24)

  const formattedPoints = relevantPoints
    .map(p => ({
      // Convert time to a numerical value (hours since epoch) for regression
      timestamp: new Date(p.created_at).getTime() / (1000 * 3600),
      value: p.value,
    }))
    .filter(p => !isNaN(p.timestamp) && p.value !== null && !isNaN(p.value));

  if (formattedPoints.length < 20) {
    return null; // Ensure there are still enough valid points after filtering
  }

  const regressionPoints = formattedPoints.map(p => [p.timestamp, p.value]);
  const { m: slope, b: intercept } = linearRegression(regressionPoints);

  // Predict the value 7 days (168 hours) from the last data point's timestamp
  const lastTimestamp = regressionPoints[regressionPoints.length - 1][0];
  const nextTimestamp = lastTimestamp + 168;
  const predictedValue = Math.max(0, slope * nextTimestamp + intercept);

  // Determine the trend based on the weekly change.
  let trend = 'stable';
  const weeklyChange = slope * 168;
  if (weeklyChange > 1.0) trend = 'increasing';
  if (weeklyChange < -1.0) trend = 'decreasing';

  return { predictedValue, trend };
};