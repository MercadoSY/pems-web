// src/components/modals/AllAlertsModals.jsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './AllAlertsModals.module.css';

const AllAlertsModal = ({ show, onHide, alerts, onAcknowledge, onAnalyze, getBadgeDetailsForAlertType }) => {
  const modalRef = useRef(null);
  const bsModalInstance = useRef(null);

  useEffect(() => {
    if (!modalRef.current) return;
    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalRef.current);
    bsModalInstance.current = modalInstance;
    
    const handleHidden = () => onHide();
    const modalEl = modalRef.current;
    modalEl.addEventListener('hidden.bs.modal', handleHidden);

    if (show) {
      modalInstance.show();
    } else {
      modalInstance.hide();
    }
    return () => modalEl.removeEventListener('hidden.bs.modal', handleHidden);
  }, [show, onHide]);

  useEffect(() => {
    return () => {
      if (bsModalInstance.current) {
        bsModalInstance.current.dispose();
        bsModalInstance.current = null;
      }
    };
  }, []);

  const unacknowledgedAlertsRaw = alerts.filter(a => !a.isAcknowledge);
  const acknowledgedAlerts = alerts.filter(a => a.isAcknowledge);

  // Group unacknowledged alerts by House AND Type to show the newest, and bundle the rest
  const activeAlertsMap = new Map();
  unacknowledgedAlertsRaw.forEach(alert => {
    const key = `${alert.branchName}-${alert.channelName}-${alert.type}`;
    if (!activeAlertsMap.has(key)) {
      activeAlertsMap.set(key, { ...alert, olderAlerts: [] });
    } else {
      activeAlertsMap.get(key).olderAlerts.push(alert);
    }
  });
  const unacknowledgedAlerts = Array.from(activeAlertsMap.values());

  const AlertItem = ({ alert, isAcknowledged }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { iconClass, iconColorClass } = getBadgeDetailsForAlertType(alert.type);
    const isSuperseded = alert.actionTaken && alert.actionTaken.includes('No actions taken');
    const hasOlder = alert.olderAlerts && alert.olderAlerts.length > 0;
    
    const itemClasses = [
        styles.listGroupItem,
        isAcknowledged ? (isSuperseded ? styles.supersededItem : styles.acknowledgedItem) : styles.unacknowledgedItem,
        isExpanded ? styles.expandedItem : ''
    ].join(' ');

    return (
        <div className={styles.alertItemContainer}>
            <div className={`list-group-item d-flex justify-content-between align-items-center ${itemClasses}`}>
                <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                    <i className={`${iconClass} ${iconColorClass} mx-3 fs-4 flex-shrink-0`}></i>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex align-items-center mb-1">
                            <small className="text-muted d-block text-truncate" title={`${alert.branchName} / ${alert.channelName} • ${alert.time}`}>
                                {alert.branchName} / <u className="text-muted">{alert.channelName}</u> 
                                <span className="ms-2">• {alert.time}</span>
                            </small>
                            {hasOlder && !isAcknowledged && (
                                <button onClick={() => setIsExpanded(!isExpanded)} className={`btn btn-sm py-0 px-2 ms-2 ${styles.toggleOlderBtn}`}>
                                    <i className="bi bi-stack me-1"></i> {alert.olderAlerts.length} Similar Pending <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} ms-1`}></i>
                                </button>
                            )}
                        </div>
                        <span className={`mb-0 d-block text-truncate ${styles.alertMessage} ${isSuperseded ? 'text-muted' : ''}`}>{alert.message}</span>
                        
                        {isAcknowledged && (
                            <div className={`${styles.actionTakenContainer} mt-1`}>
                                {alert.acknowledgedBy && (
                                    <div className="d-flex align-items-center me-3" title={`Acknowledged by: ${alert.acknowledgedBy}`}>
                                        <i className={`bi ${isSuperseded ? 'bi-person text-secondary' : 'bi-person-check-fill text-success'} me-1`}></i>
                                        <small className={isSuperseded ? 'text-secondary' : 'text-muted'}>{alert.acknowledgedBy}</small>
                                    </div>
                                )}
                                {alert.actionTaken && alert.actionTaken.length > 0 && (
                                    <div className="d-flex align-items-center" title={`Actions: ${alert.actionTaken.join(', ')}`}>
                                        <i className={`bi ${isSuperseded ? 'bi-x-circle text-warning' : 'bi-tools text-secondary'} me-1`}></i>
                                        <small className={isSuperseded ? styles.supersededText : 'text-muted text-truncate'}>
                                            {alert.actionTaken.join(', ')}
                                        </small>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="d-flex align-items-center flex-shrink-0 ms-2">
                    {isAcknowledged ? (
                        <i className={`bi ${isSuperseded ? 'bi-dash-circle text-warning' : 'bi-check-circle-fill text-success'} fs-4`} title={isSuperseded ? "Superseded" : "Acknowledged"}></i>
                    ) : (
                        <>
                            <button className="btn btn-outline-primary me-2" title={`Analyze Alert: ${alert.message}`} onClick={(e) => { e.stopPropagation(); onAnalyze(alert); }}>
                                <i className="bi bi-clipboard2-data"></i>
                            </button>
                            <button className="btn btn-outline-success" title={`Acknowledge Alert: ${alert.message}`} onClick={(e) => { e.stopPropagation(); onAcknowledge(alert); }}>
                                <i className="bi bi-check-circle"></i>
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Render Sub-alerts Dropdown */}
            {isExpanded && hasOlder && (
                <div className={styles.subAlertsPanel}>
                    <div className={styles.subAlertsHeader}>
                        <i className="bi bi-arrow-return-right me-2"></i> Older similar alerts:
                    </div>
                    {alert.olderAlerts.map(oldAlert => (
                        <div key={oldAlert.id} className={styles.subAlertItem}>
                            <span className={`badge bg-secondary me-2 ${styles.subAlertTime}`}>{oldAlert.time}</span>
                            <span className="text-muted">{oldAlert.message}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="modal fade" id="allAlertsModal" tabIndex="-1" aria-labelledby="allAlertsModalLabel" aria-hidden="true" ref={modalRef}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="allAlertsModalLabel"><i className="bi bi-bell-fill me-2"></i>All Alerts</h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body" style={{ padding: '0' }}>
            <div id="allAlertsContainer" className="list-group list-group-flush">
              {alerts.length === 0 ? (
                <p className="text-center text-muted p-3">No alerts found.</p>
              ) : (
                <>
                  {unacknowledgedAlerts.length === 0 && (
                      <div className="p-4 text-center text-muted">
                        <h5><i className="bi bi-check2-circle me-2"></i>No new alerts</h5>
                        <p className="mb-0">All active alerts have been acknowledged.</p>
                      </div>
                  )}
                  {unacknowledgedAlerts.map(alert => <AlertItem key={alert.id} alert={alert} isAcknowledged={false} />)}

                  {acknowledgedAlerts.length > 0 && (
                    <>
                      <div className={styles.historySeparator}><span>Recent History</span></div>
                      {acknowledgedAlerts.map(alert => <AlertItem key={alert.id} alert={alert} isAcknowledged={true} />)}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAlertsModal;