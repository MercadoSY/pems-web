import React from 'react';

// Renders a fallback UI when no data is available.
export const NoDataResponse = ({ message }) => (
  <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted p-3" style={{ opacity: 0.8 }}>
    <img
      src="/noData_icon.webp"
      alt="No data available"
      style={{ maxWidth: '100px', marginBottom: '1rem' }}
      // PERFORMANCE: Add width/height to prevent layout shift and lazy loading
      width="100"
      height="100"
      loading="lazy"
    />
    <h6 className="mb-0 fw-normal">{message || 'No Data to Display'}</h6>
  </div>
);