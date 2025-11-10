// src/components/modals/ChangeNameModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './ChangeNameModal.module.css';
import { getAuth } from 'firebase/auth';

/**
 * A modal dialog for users to change their account display name.
 */
const ChangeNameModal = ({ isOpen, onClose, onSubmit, currentName }) => {
  const [newName, setNewName] = useState(currentName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Resets the modal's state when it is opened.
  useEffect(() => {
    if (isOpen) {
      const auth = getAuth();
      const user = auth.currentUser;
      setNewName(currentName || (user ? user.displayName : '') || '');
      setCurrentPassword('');
      setIsSubmitting(false);
      setError('');
      setIsPasswordVisible(false);
    }
  }, [isOpen, currentName]);

  // Handles the form submission to change the user's name.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !currentPassword) {
      setError("New name and current password are required.");
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(newName.trim(), currentPassword);
      // Success is handled by the parent, which will close the modal.
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.modalHeader}>
            <h5 className={styles.modalTitle}>Change Display Name</h5>
            <button type="button" className={styles.closeButton} onClick={onClose} disabled={isSubmitting} aria-label="Close">×</button>
          </div>
          <div className={styles.modalBody}>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <p className="text-muted small mb-3">Enter your new display name and confirm with your current password.</p>
            <div className="mb-3">
              <label htmlFor="newName" className="form-label">New Display Name</label>
              <input
                type="text"
                className="form-control"
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="Enter your new name"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="currentPasswordForName" className="form-label">Current Password</label>
              <div className="input-group">
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  className="form-control"
                  id="currentPasswordForName"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                />
                <button className="btn btn-outline-secondary" type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <i className={`bi ${isPasswordVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className={`${styles.btn} ${styles.btnConfirm}`} disabled={isSubmitting || !newName.trim() || !currentPassword}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeNameModal;