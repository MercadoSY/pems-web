import React from 'react'
import styles from './dataTable.module.css';

const features = [
  'Real-Time Monitoring',
  'Cloud Data',
  'Alerts & Notification',
  'Data Analytics',
  'Generate Reports',
  'Predictive Insight',
  'Multiple Branches',
  'Multiple Poultry Houses',
  'Manage Workers',
  'Support',
];

/**
 * Renders a table of platform features.
 */
export default function DataTable() {
  return (
    <div className={styles.table}>
      <div className={`${styles['table-cell']} ${styles.header}`}>
        <h3>Features</h3>
      </div>
      <div className={`${styles['table-cell']} ${styles.header}`}>
        <h3>PEMS</h3>
      </div>

      {features.map((feature, idx) => (
        <React.Fragment key={idx}>
          <div className={`${styles['table-cell']} ${styles['cell-feature']} ${idx % 2 !== 0 ? styles.striped : ''}`}>
            {feature}
          </div>
          <div className={`${styles['table-cell']} ${styles.cellCheck} ${idx % 2 !== 0 ? styles.striped : ''}`}>
            <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <title>check_green</title>
              <path
                d="M6.116 14.884c.488.488 1.28.488 1.768 0l10-10c.488-.488.488-1.28 0-1.768s-1.28-.488-1.768 0l-9.08 9.15-4.152-4.15c-.488-.488-1.28-.488-1.768 0s-.488 1.28 0 1.768l5 5z"
                fill="#008c2f"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}