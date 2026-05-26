import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import styles from '../styles/HistoryLogsPage.module.css';

// Mock data for initial rendering
const MOCK_LOGS = [
    { id: 1, action: "User Login", details: "Admin account logged in successfully.", user: "Admin", timestamp: "2023-10-27 08:00 AM" },
    { id: 2, action: "Report Generated", details: "Generated monthly analytics report for House A.", user: "Admin", timestamp: "2023-10-26 04:30 PM" },
    { id: 3, action: "Sensor Threshold Updated", details: "Ammonia alert threshold increased to 25ppm.", user: "Manager", timestamp: "2023-10-25 11:15 AM" },
    { id: 4, action: "Worker Added", details: "Added new worker profile (John Doe).", user: "Admin", timestamp: "2023-10-24 09:00 AM" },
];

/** Renders the History Logs page displaying recent system activities and events. */
export default function HistoryLogsPage() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [logs] = useState(MOCK_LOGS);

    const toggleSidebar = () => setIsSidebarExpanded((prev) => !prev);

    return (
        <div className="d-flex">
            <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />

            <main
                className={styles.mainContent}
                style={{
                    marginLeft: isSidebarExpanded ? '260px' : '70px',
                    transition: 'margin-left 0.3s ease',
                }}
            >
                <div className="container-fluid py-3">
                    <div className={styles.pageHeader}>
                        <h1 className={styles.title}>
                            <span className={`input-group-text ${styles.iconSpan}`}>
                                <i className="bi bi-clock-history fs-2"></i>
                            </span>
                            History Logs
                        </h1>
                        <p>View recent activities and system events</p>
                    </div> 
                    
                    <div className={styles.buttonContainer}>
                        <button className={styles.exportButton}>
                            Export Logs
                        </button>
                    </div>

                    <div className={styles.logsContainer}>
                        {logs.length === 0 ? (
                            <p className={styles.emptyMessage}>No history logs available</p>
                        ) : (
                            <div className={styles.logsList}>
                                {logs.map((log) => (
                                    <div key={log.id} className={styles.logCard}>
                                        <div className={styles.logInfo}>
                                            <h3>{log.action}</h3>
                                            <p><strong>Details:</strong> {log.details}</p>
                                            <p><strong>User:</strong> {log.user}</p>
                                        </div>
                                        <div className={styles.logTime}>
                                            <i className="bi bi-calendar-event me-2"></i>
                                            {log.timestamp}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}