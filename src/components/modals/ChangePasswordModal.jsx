// src/components/modals/ChangePasswordModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './ChangePasswordModal.module.css';
import NotificationModal from './NotificationModal';

/**
 * A modal dialog for users to change their account password.
 */
const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info', title: '' });
  
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSubmitting(false);
      setIsCurrentPasswordVisible(false);
      setIsNewPasswordVisible(false);
      setIsConfirmPasswordVisible(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotification({ isOpen: true, title: "Validation Error", message: "New passwords do not match.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setNotification({ isOpen: true, title: "Validation Error", message: "New password must be at least 6 characters long.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(currentPassword, newPassword);
      // Success is handled by the parent component, which will close the modal.
    } catch (error) {
      setNotification({ isOpen: true, title: "Update Failed", message: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ isOpen: false, message: '', type: 'info', title: '' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.modalHeader}>
              <h5 className={styles.modalTitle}>Change Password</h5>
              <button type="button" className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Close">×</button>
            </div>
            <div className={styles.modalBody}>
              <div className="mb-3">
                <label htmlFor="currentPassword" className="form-label">Current Password</label>
                <div className="input-group">
                  <input
                    type={isCurrentPasswordVisible ? 'text' : 'password'}
                    className="form-control"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                   <button className="btn btn-outline-secondary" type="button" onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}>
                    <i className={`bi ${isCurrentPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <div className="input-group">
                  <input
                    type={isNewPasswordVisible ? 'text' : 'password'}
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)}>
                    <i className={`bi ${isNewPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <div className="input-group">
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                    <i className={`bi ${isConfirmPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              {isSubmitting && <div className="text-center my-3"><div className="spinner-border text-primary spinner-border-sm" role="status"></div><span className="ms-2">Processing...</span></div>}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className={`${styles.btn} ${styles.btnConfirm}`} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <NotificationModal {...notification} onClose={handleCloseNotification} />
    </>
  );
};

export default ChangePasswordModal;