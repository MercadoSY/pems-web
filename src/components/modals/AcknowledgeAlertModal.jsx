// src/components/modals/AcknowledgeAlertModal.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './AcknowledgeAlertModal.module.css';

const ammoniaActions = [
  'Cleaned animal waste',
  'Improved airflow',
  'Reduced animal capacity',
  'Checked feed and water quality',
];
const temperatureActions = [
  'Activated cooling system',
  'Activated heating system',
  'Improved airflow',
  'Increased water supply',
];

const AcknowledgeAlertModal = ({ show, onHide, alert, onSubmit }) => {
  const modalRef = useRef(null);
  const bsModalInstance = useRef(null);
  const [selectedActions, setSelectedActions] = useState(new Set());

  useEffect(() => {
    if (!modalRef.current) return;
    const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalRef.current);
    bsModalInstance.current = modalInstance;
    
    const handleHidden = () => {
      onHide();
      setSelectedActions(new Set()); // Reset state when modal is hidden
    };
    const modalEl = modalRef.current;
    modalEl.addEventListener('hidden.bs.modal', handleHidden);

    if (show) {
      modalInstance.show();
    } else {
      modalInstance.hide();
    }
    return () => modalEl.removeEventListener('hidden.bs.modal', handleHidden);
  }, [show, onHide]);

  const availableActions = useMemo(() => {
    if (!alert) return [];
    const type = alert.type?.toLowerCase();
    if (type === 'ammonia') return ammoniaActions;
    if (type === 'temperature') return temperatureActions;
    if (type === 'both') return [...new Set([...ammoniaActions, ...temperatureActions])].sort();
    return ['General Inspection']; // Fallback for unknown types
  }, [alert]);

  const handleCheckboxChange = (action, isChecked) => {
    const newSelectedActions = new Set(selectedActions);
    if (isChecked) {
      newSelectedActions.add(action);
    } else {
      newSelectedActions.delete(action);
    }
    setSelectedActions(newSelectedActions);
  };

  const handleSubmit = () => {
    if (selectedActions.size > 0) {
      onSubmit(Array.from(selectedActions));
    }
  };

  const olderAlertsCount = alert?.olderAlerts?.length || 0;

  return (
    <div className="modal fade" id="acknowledgeAlertModal" tabIndex="-1" aria-labelledby="acknowledgeAlertModalLabel" aria-hidden="true" ref={modalRef}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="acknowledgeAlertModalLabel"><i className="bi bi-check2-square me-2"></i>Acknowledge Alert</h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {alert && (
              <>
                <div className={styles.alertInfo}>
                    <p className="mb-1"><strong>Branch:</strong> {alert.branchName}</p>
                    <p className="mb-1"><strong>Poultry House:</strong> {alert.channelName}</p>
                    <p className="mb-2"><strong>Message:</strong> <span className="fw-bold">{alert.message}</span></p>
                </div>
                
                {olderAlertsCount > 0 && (
                  <div className="alert alert-warning py-2 mt-3 mb-0 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-info-circle-fill me-2 fs-5"></i>
                    <span>Acknowledging this alert will automatically close <strong>{olderAlertsCount} older pending <span className="text-capitalize">{alert.type}</span> alert(s)</strong> for this house.</span>
                  </div>
                )}
                
                <hr />
                <p>Select all actions taken to resolve this issue:</p>
                <div className={styles.actionsContainer}>
                  {availableActions.map(action => (
                    <div className="form-check" key={action}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={action}
                        id={`action-${action.replace(/\s+/g, '-')}`}
                        onChange={(e) => handleCheckboxChange(action, e.target.checked)}
                        checked={selectedActions.has(action)}
                      />
                      <label className="form-check-label" htmlFor={`action-${action.replace(/\s+/g, '-')}`}>
                        {action}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
            <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={selectedActions.size === 0}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcknowledgeAlertModal;