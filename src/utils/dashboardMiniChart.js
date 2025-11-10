// src/utils/dashboardMiniChart.js
import Chart from 'chart.js/auto';

// Plugin to display a message in the center of the chart when no data is available.
const centerTextMessagePlugin = {
  id: 'centerTextMessage',
  afterDraw: (chart) => {
    // Check if there are no datasets or the first dataset has no data.
    if (chart.data.datasets.length === 0 || chart.data.datasets[0].data.length === 0) {
      const { ctx, chartArea: { left, top, right, bottom } } = chart;
      const message = chart.options.plugins.centerTextMessage?.text || 'No Data Available';
      const fontColor = chart.options.plugins.centerTextMessage?.color || '#6c757d'; // Bootstrap's text-muted
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `14px "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = fontColor;
      
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;
      
      ctx.fillText(message, centerX, centerY);
      ctx.restore();
    }
  }
};

// Register the plugin to be used across all chart instances.
Chart.register(centerTextMessagePlugin);

// Creates configuration for the mini line charts.
const getMiniChartConfig = (labels, data, lineBorderColor) => {
    const isAmmonia = lineBorderColor === "#28a745";
    const gradientStartColor = isAmmonia ? 'rgba(40, 167, 69, 0.05)' : 'rgba(255, 193, 7, 0.05)';
    const gradientEndColor = isAmmonia ? 'rgba(40, 167, 69, 0.4)' : 'rgba(255, 193, 7, 0.4)';

    return {
        type: "line",
        data: {
            labels,
            datasets: [{
                data,
                borderColor: lineBorderColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return isAmmonia ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)';
                    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    gradient.addColorStop(0, gradientStartColor);
                    gradient.addColorStop(1, gradientEndColor);
                    return gradient;
                },
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
            elements: { point: { radius: 0 } },
        },
    };
};

// Creates a new chart or clears an existing one, displaying a message in the center.
export const createOrClearChart = (canvasRef, chartInstanceRef, message = "Awaiting Data") => {
    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            chartInstanceRef.current = new Chart(ctx, {
                type: 'line',
                data: { labels: [], datasets: [] }, // Empty data triggers the centerTextMessagePlugin
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        centerTextMessage: {
                            text: message,
                            color: '#6c757d'
                        }
                    },
                    scales: { x: { display: false }, y: { display: false } },
                    elements: { point: { radius: 0 } }
                }
            });
        }
    }
};

// Defines the default empty state for the performance summary.
const emptyPerformanceSummary = {
    highestAmmoniaVal: null, highestAmmoniaTime: '--',
    lowestAmmoniaVal: null, lowestAmmoniaTime: '--',
    highestTempVal: null, highestTempTime: '--',
    lowestTempVal: null, lowestTempTime: '--',
};

// Groups and averages feed data by a specified time interval in minutes.
const averageDataByInterval = (feeds, intervalMinutes, tempField, ammoniaField) => {
    if (!feeds || feeds.length === 0) {
      return { labels: [], tempData: [], ammoniaData: [] };
    }
  
    const groupedData = {};
  
    for (const feed of feeds) {
      const timestamp = new Date(feed.created_at);
      const intervalStart = new Date(timestamp);
      intervalStart.setMinutes(Math.floor(timestamp.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);
  
      const key = intervalStart.getTime();
  
      if (!groupedData[key]) {
        groupedData[key] = {
          tempSum: 0,
          tempCount: 0,
          ammoniaSum: 0,
          ammoniaCount: 0,
          timestamp: intervalStart,
        };
      }
  
      const temp = parseFloat(feed[tempField]);
      if (!isNaN(temp)) {
        groupedData[key].tempSum += temp;
        groupedData[key].tempCount++;
      }
  
      const ammonia = parseFloat(feed[ammoniaField]);
      if (!isNaN(ammonia)) {
        groupedData[key].ammoniaSum += ammonia;
        groupedData[key].ammoniaCount++;
      }
    }
  
    const sortedKeys = Object.keys(groupedData).sort((a, b) => parseInt(a) - parseInt(b));
  
    const labels = [];
    const tempData = [];
    const ammoniaData = [];
  
    for (const key of sortedKeys) {
      const group = groupedData[key];
      labels.push(group.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      const avgTemp = group.tempCount > 0 ? group.tempSum / group.tempCount : null;
      tempData.push(avgTemp);
      
      const avgAmmonia = group.ammoniaCount > 0 ? group.ammoniaSum / group.ammoniaCount : null;
      ammoniaData.push(avgAmmonia);
    }
  
    return { labels, tempData, ammoniaData };
};

// Fetches today's data and updates mini charts and performance summary.
export const updateDashboardVisuals = async ({
    channelConfig,
    ammoniaMiniChartRef,
    tempMiniChartRef,
    ammoniaChartInstanceRef,
    tempChartInstanceRef,
    setPerformanceSummary
}) => {
    if (!channelConfig || !channelConfig.ID || !channelConfig.ReadAPI) {
        createOrClearChart(ammoniaMiniChartRef, ammoniaChartInstanceRef);
        createOrClearChart(tempMiniChartRef, tempChartInstanceRef);
        setPerformanceSummary(emptyPerformanceSummary);
        return;
    }

    try {
        const tempUnit = localStorage.getItem('tempUnit') || 'C';
        const convertTemp = (celsius) => {
            if (tempUnit === 'F' && typeof celsius === 'number' && !isNaN(celsius)) {
                return celsius * 9 / 5 + 32;
            }
            return celsius;
        };

        const ammoniaField = channelConfig.AmmoniaField || "field3";
        const tempField = channelConfig.TempField || "field1";

        // Fetch all of today's data in a single API call.
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const formatThingSpeakDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}%20${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
        const startDateStr = formatThingSpeakDate(startOfDay);
        const endDateStr = formatThingSpeakDate(endOfDay);
        
        const todayDataResponse = await fetch(`https://api.thingspeak.com/channels/${channelConfig.ID}/feeds.json?api_key=${channelConfig.ReadAPI}&start=${startDateStr}&end=${endDateStr}&timezone=Asia/Singapore`);

        if (!todayDataResponse.ok) throw new Error(`ThingSpeak API error for today's data: ${todayDataResponse.status}`);
        const todayData = await todayDataResponse.json();

        if (todayData.feeds && todayData.feeds.length > 0) {
            const feeds = todayData.feeds;
            
            // Average data for charts over 5-minute intervals.
            const { labels, tempData, ammoniaData } = averageDataByInterval(feeds, 5, tempField, ammoniaField);
            const displayTempData = tempData.map(convertTemp);

            if (ammoniaChartInstanceRef.current) {
                ammoniaChartInstanceRef.current.data.labels = labels;
                ammoniaChartInstanceRef.current.data.datasets = getMiniChartConfig(labels, ammoniaData, "#28a745").data.datasets;
                ammoniaChartInstanceRef.current.update();
            } else if (ammoniaMiniChartRef.current) {
                ammoniaChartInstanceRef.current = new Chart(ammoniaMiniChartRef.current.getContext('2d'), getMiniChartConfig(labels, ammoniaData, "#28a745"));
            }

            if (tempChartInstanceRef.current) {
                tempChartInstanceRef.current.data.labels = labels;
                tempChartInstanceRef.current.data.datasets = getMiniChartConfig(labels, displayTempData, "#ffc107").data.datasets;
                tempChartInstanceRef.current.update();
            } else if (tempMiniChartRef.current) {
                tempChartInstanceRef.current = new Chart(tempMiniChartRef.current.getContext('2d'), getMiniChartConfig(labels, displayTempData, "#ffc107"));
            }

            let maxAmmonia = -Infinity, minAmmonia = Infinity, maxTemp = -Infinity, minTemp = Infinity;
            let maxAmmoniaTime = "--", minAmmoniaTime = "--", maxTempTime = "--", minTempTime = "--";
            
            feeds.forEach((feed) => {
                const feedDate = new Date(feed.created_at);
                const timeStr = feedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const ammonia = parseFloat(feed[ammoniaField]);
                if (!isNaN(ammonia)) {
                    if (ammonia > maxAmmonia) { maxAmmonia = ammonia; maxAmmoniaTime = timeStr; }
                    if (ammonia < minAmmonia) { minAmmonia = ammonia; minAmmoniaTime = timeStr; }
                }
                const temp = parseFloat(feed[tempField]);
                if (!isNaN(temp)) {
                    if (temp > maxTemp) { maxTemp = temp; maxTempTime = timeStr; }
                    if (temp < minTemp) { minTemp = temp; minTempTime = timeStr; }
                }
            });
            
            setPerformanceSummary({
                highestAmmoniaVal: maxAmmonia === -Infinity ? null : maxAmmonia, highestAmmoniaTime: maxAmmoniaTime,
                lowestAmmoniaVal: minAmmonia === Infinity ? null : minAmmonia, lowestAmmoniaTime: minAmmoniaTime,
                highestTempVal: maxTemp === -Infinity ? null : maxTemp, highestTempTime: maxTempTime,
                lowestTempVal: minTemp === Infinity ? null : minTemp, lowestTempTime: minTempTime,
            });
        } else {
            createOrClearChart(ammoniaMiniChartRef, ammoniaChartInstanceRef, "No Data for Today");
            createOrClearChart(tempMiniChartRef, tempChartInstanceRef, "No Data for Today");
            setPerformanceSummary(emptyPerformanceSummary);
        }

    } catch (err) {
        console.error("Error fetching data for charts or summary:", err);
        createOrClearChart(ammoniaMiniChartRef, ammoniaChartInstanceRef, "Error Loading Data");
        createOrClearChart(tempMiniChartRef, tempChartInstanceRef, "Error Loading Data");
        setPerformanceSummary({
            highestAmmoniaVal: 'Error', highestAmmoniaTime: '--',
            lowestAmmoniaVal: 'Error', lowestAmmoniaTime: '--',
            highestTempVal: 'Error', highestTempTime: '--',
            lowestTempVal: 'Error', lowestTempTime: '--',
        });
    }
};