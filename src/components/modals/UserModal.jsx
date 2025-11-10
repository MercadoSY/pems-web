// src/components/modals/UserModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './UserModal.module.css';

// List of country codes. Defaulting to Philippines as requested.
const countryCodes = [
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
];

/**
 * Modal for creating a new user or editing an existing one.
 */
const UserModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  isLoading,
  branches = [],
}) => {
  const isEditMode = !!currentUser;

  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+63'); // Default to Philippines
  const [phoneNumber, setPhoneNumber] = useState('');
  const [branchId, setBranchId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Resets and populates form state when modal opens or user changes.
  useEffect(() => {
    if (isOpen) {
      setFormError('');
      setShowPassword(false);
      if (isEditMode && currentUser) {
        setRole(currentUser.role || 'Worker');
        setName(currentUser.name || '');
        setBranchId(currentUser.branchRefs?.[0]?.id || '');

        const fullPhoneNumber = currentUser.id || '';
        // Sort codes by length to handle prefixes correctly (e.g., +1 for US/Canada)
        const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
        const matchedCode = sortedCodes.find(c => fullPhoneNumber.startsWith(c.code.substring(1)));

        if (matchedCode) {
          setCountryCode(matchedCode.code);
          setPhoneNumber(fullPhoneNumber.substring(matchedCode.code.length - 1));
        } else {
          setCountryCode('+63'); // Default if no code matches
          setPhoneNumber(fullPhoneNumber);
        }
      } else {
        setRole('');
        setName('');
        setCountryCode('+63');
        setPhoneNumber('');
        setBranchId('');
        setEmail('');
        setPassword('');
      }
    }
  }, [isOpen, currentUser, isEditMode]);

  // Handles changes to name inputs, allowing only letters and spaces.
  const handleNameChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
    setName(filteredValue);
  };

  // Handles form submission, validation, and calling the onSubmit prop.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    let formData = { role };
    let validationError = '';
    const currentRole = isEditMode ? 'Worker' : role;

    if (!isEditMode && !currentRole) {
      validationError = 'A role must be selected.';
    } else if (currentRole === 'Worker') {
      const localPhoneNumber = phoneNumber.trim();
      if (!name.trim()) validationError = 'Worker name is required.';
      else if (!localPhoneNumber) validationError = 'Phone number is required.';
      else if (!branchId) validationError = 'A branch must be selected for the worker.';
      else {
        const fullPhoneNumber = `${countryCode.substring(1)}${localPhoneNumber}`;
        if (!/^\d{6,15}$/.test(fullPhoneNumber)) {
          validationError = 'Invalid Phone Number. Please check country code and number.';
        } else {
          formData = { ...formData, name: name.trim(), phoneNumber: fullPhoneNumber, branchId };
        }
      }
    } else if (currentRole === 'Admin') {
      if (!name.trim()) validationError = 'Admin name is required.';
      else if (!/\S+@\S+\.\S+/.test(email)) validationError = "A valid email is required for admins.";
      else if (password.length < 6) validationError = "Password must be at least 6 characters long.";
      formData = { ...formData, name: name.trim(), email: email.trim().toLowerCase(), password };
    }

    if (validationError) {
      setFormError(validationError);
      return;
    }
    try {
      await onSubmit(formData, isEditMode);
    } catch (error) {
      setFormError(error.message || 'An unexpected error occurred.');
    }
  };
  
  // Renders form fields specific to the 'Worker' role.
  const renderWorkerFields = () => (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.formLabel}>Worker Name</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-person"></i></span>
          <input type="text" id="name" className="form-control" value={name} onChange={handleNameChange} disabled={isLoading} required placeholder="Enter their name" />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber" className={styles.formLabel}>Phone Number</label>
        <div className="input-group">
          <select
            className="form-select"
            style={{ flex: '0 0 auto', width: 'auto', maxWidth: '140px' }}
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            disabled={isLoading}
            aria-label="Country Code"
          >
            {countryCodes.map(c => <option key={`${c.name}-${c.code}`} value={c.code}>{c.flag} {c.code}</option>)}
          </select>
          <input type="tel" id="phoneNumber" className="form-control" value={phoneNumber} onChange={(e) => {const numericValue = e.target.value.replace(/\D/g, ''); setPhoneNumber(numericValue)}} disabled={isLoading} required placeholder="e.g. 9171234567" />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="branch" className={styles.formLabel}>Branch</label>
        <select id="branch" className="form-select" value={branchId} onChange={(e) => setBranchId(e.target.value)} required disabled={isLoading}>
          <option value="" disabled>-- Select a Branch --</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
    </>
  );

  // Renders form fields specific to the 'Admin' role.
  const renderAdminFields = () => (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.formLabel}>Admin Name</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-person"></i></span>
          <input type="text" id="name" className="form-control" value={name} onChange={handleNameChange} disabled={isLoading} required placeholder="Enter their name" />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.formLabel}>Admin Email</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-envelope"></i></span>
          <input type="email" id="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required autoComplete="username" placeholder="Enter their email" />
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="password" className={styles.formLabel}>Password</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-key"></i></span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="new-password"
            placeholder="Enter your their password"
          />
          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
          </button>
        </div>
        <small className="form-text text-muted">Password must be at least 6 characters.</small>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>{isEditMode ? `Edit Worker` : 'Add New User'}</h5>
          <button onClick={onClose} className={styles.btnClose} aria-label="Close modal" disabled={isLoading}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody} autoComplete="off">
          {isEditMode ? (
            renderWorkerFields()
          ) : (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="role" className={styles.formLabel}>Role</label>
                <select id="role" className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required disabled={isLoading}>
                  <option value="" disabled>-- Select a Role --</option>
                  <option value="Worker">Worker</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {role && <hr className={styles.separator} />}
              {role === 'Worker' && renderWorkerFields()}
              {role === 'Admin' && renderAdminFields()}
            </>
          )}

          {formError && <div className={styles.errorMessage}>{formError}</div>}

          <div className={styles.modalActions}>
            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isLoading || (!isEditMode && !role)}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span className="ms-1">Saving...</span>
                </>
              ) : (isEditMode ? 'Save Changes' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;