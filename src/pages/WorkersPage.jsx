import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import UserModal from '../components/modals/UserModal';
import NotificationModal from '../components/modals/NotificationModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import DeleteKeyModal from '../components/modals/DeleteKeyModal';
import styles from '../styles/WorkersPage.module.css';
import { auth } from '../firebase/firebaseConfig';

import {
  fetchAllUsersAndAdmins,
  fetchAllBranches,
  fetchPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  createAdmin,
  createWorker,
  deleteAdmin,
  deleteWorker,
  updateWorker,
  fetchDeleteKey,
} from '../firebase/userManagement';

const WorkersPage = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const [activeFilters, setActiveFilters] = useState({ role: 'All', branch: 'All' });
  const [sortConfig, setSortConfig] = useState({ key: 'dateAdded', order: 'desc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUserForModal, setCurrentUserForModal] = useState(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [pageBlur, setPageBlur] = useState(false);

  const [notification, setNotification] = useState({ isOpen: false, message: '', type: 'info', title: '' });

  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirmAction: null,
    confirmButtonText: 'Confirm',
    confirmButtonType: 'primary',
    isProcessing: false,
  });

  const [isDeleteKeyModalOpen, setIsDeleteKeyModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isProcessingDeleteKey, setIsProcessingDeleteKey] = useState(false);

  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersList, branchesList, pendingList] = await Promise.all([
        fetchAllUsersAndAdmins(),
        fetchAllBranches(),
        fetchPendingRegistrations()
      ]);
      setUsers(usersList);
      setBranches(branchesList);
      setPendingUsers(pendingList);
    } catch (err) {
      console.error("Error fetching page data:", err);
      setError("Failed to load page data. " + err.message);
      setUsers([]);
      setBranches([]);
      setPendingUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    setPageBlur(isModalOpen || notification.isOpen || confirmationState.isOpen || isDeleteKeyModalOpen);
  }, [isModalOpen, notification.isOpen, confirmationState.isOpen, isDeleteKeyModalOpen]);

  const { adminCount, workerCount } = useMemo(() => {
    return users.reduce(
      (counts, user) => {
        if (user.role === 'Admin') {
          counts.adminCount++;
        } else if (user.role === 'Worker') {
          counts.workerCount++;
        }
        return counts;
      },
      { adminCount: 0, workerCount: 0 }
    );
  }, [users]);

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleOpenAddModal = () => {
    setCurrentUserForModal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setCurrentUserForModal(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUserForModal(null);
    setIsSubmittingModal(false);
  };

  const handleCloseNotification = () => {
    setNotification({ isOpen: false, message: '', type: 'info', title: '' });
  };

  const handleCloseConfirmation = () => {
    setConfirmationState({ isOpen: false, title: '', message: '', onConfirmAction: null, isProcessing: false });
  };
  
  const handleCloseDeleteKeyModal = () => {
    setIsDeleteKeyModalOpen(false);
    setUserToDelete(null);
    setIsProcessingDeleteKey(false);
  };

  const requestConfirmation = (title, message, onConfirmCallback, confirmButtonText = 'Confirm', confirmButtonType = 'primary') => {
    setConfirmationState({
      isOpen: true,
      title,
      message,
      onConfirmAction: async () => {
        setConfirmationState(prev => ({ ...prev, isProcessing: true }));
        try {
          await onConfirmCallback();
        } catch (error) {
          console.error("Confirmation action failed:", error);
          setNotification({
            isOpen: true,
            title: "Action Failed",
            message: error.message || "An unexpected error occurred.",
            type: "error",
          });
        } finally {
          setConfirmationState(prev => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
      confirmButtonText,
      confirmButtonType,
      isProcessing: false,
    });
  };

  const handleSubmitUserForm = async (formData, isEditMode) => {
    setIsSubmittingModal(true);
    setError(null);
    const { role } = formData;
    try {
      if (isEditMode) {
        if (role === 'Worker') {
          await updateWorker(currentUserForModal.id, formData);
          setNotification({ isOpen: true, message: 'Worker updated successfully!', type: "success", title: "Update Successful" });
        } else {
          throw new Error("Editing admin details is not supported through this form.");
        }
      } else {
        if (role === 'Admin') {
          await createAdmin(formData.name, formData.email, formData.password);
          setNotification({ isOpen: true, message: 'Admin created successfully!', type: "success", title: "Admin Created" });
        } else if (role === 'Worker') {
          await createWorker(formData.name, formData.phoneNumber, formData.branchId);
          setNotification({ isOpen: true, message: 'Worker created successfully!', type: "success", title: "Worker Created" });
        }
      }
      console.log(`User form submitted successfully. Mode: ${isEditMode ? 'Edit' : 'Create'}, Role: ${role}`);
      fetchAllData();
      handleCloseModal();
    } catch (err) {
      console.error("Error submitting user form:", err);
      throw err;
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setNotification({
        isOpen: true,
        title: "Authentication Error",
        message: "Could not verify your identity. Please refresh and try again.",
        type: "error",
      });
      return;
    }

    if (user.role === 'Admin' && user.id === currentUser.email) {
      setNotification({
        isOpen: true,
        title: "Action Prohibited",
        message: "You cannot delete your own account.",
        type: "warning",
      });
      return;
    }

    if (user.role === 'Admin') {
      setUserToDelete(user);
      setIsDeleteKeyModalOpen(true);
    } else { // Worker
      const displayName = user.name;
      const actionType = 'remove their record';
      requestConfirmation(
        `Confirm Worker Deletion`,
        `Are you sure you want to delete ${displayName}? This will ${actionType} and cannot be undone.`,
        async () => {
          setIsLoading(true);
          setError(null);
          try {
            await deleteWorker(user.id);
            setNotification({ isOpen: true, message: `Worker ${displayName} deleted successfully.`, type: "success", title: "Deletion Successful" });
            console.log(`Successfully deleted worker '${displayName}'.`);
            fetchAllData();
          } catch (err) {
            console.error(`Error deleting Worker:`, err);
            setNotification({ isOpen: true, message: `Failed to delete ${displayName}. ${err.message}`, type: "error", title: "Deletion Failed" });
          } finally {
            setIsLoading(false);
          }
        },
        `Delete Worker`,
        'danger'
      );
    }
  };

  const handleSubmitDeleteKey = async (enteredKey) => {
    if (!userToDelete) return;
    
    setIsProcessingDeleteKey(true);
    console.log(`Verifying delete key for admin '${userToDelete.name}'.`);
    
    try {
        const correctKey = await fetchDeleteKey();
        if (enteredKey !== correctKey) {
            setNotification({
                isOpen: true,
                title: "Incorrect Key",
                message: "The delete key you entered is incorrect. Deletion aborted.",
                type: "error",
            });
            console.warn(`Failed admin deletion attempt for '${userToDelete.name}' due to incorrect key.`);
            handleCloseDeleteKeyModal(); // Close the modal on failure
            return;
        }

        // Key is correct, now close key modal and show final confirmation
        const displayName = userToDelete.name;
        handleCloseDeleteKeyModal();

        requestConfirmation(
            `Confirm Admin Deletion`,
            `Key verified. Are you sure you want to permanently delete admin ${displayName}? This will delete their authentication account and cannot be undone.`,
            async () => {
                setIsLoading(true);
                setError(null);
                try {
                    await deleteAdmin(userToDelete.id);
                    setNotification({ isOpen: true, message: `Admin ${displayName} deleted successfully.`, type: "success", title: "Deletion Successful" });
                    console.log(`Successfully deleted admin '${displayName}'.`);
                    fetchAllData();
                } catch (err) {
                    console.error(`Error deleting Admin:`, err);
                    setNotification({ isOpen: true, message: `Failed to delete ${displayName}. ${err.message}`, type: "error", title: "Deletion Failed" });
                } finally {
                    setIsLoading(false);
                }
            },
            `Delete Admin`,
            'danger'
        );

    } catch (err) {
        console.error("Error during admin deletion process:", err);
        setNotification({
            isOpen: true,
            title: "Deletion Failed",
            message: err.message || "An unexpected error occurred. The admin was not deleted.",
            type: "error",
        });
        handleCloseDeleteKeyModal();
    }
  };
  
  const handleApproveRegistration = (pendingUser) => {
    requestConfirmation(
        'Confirm Approval',
        `Are you sure you want to approve ${pendingUser.name} for the "${pendingUser.branchName}" branch?`,
        async () => {
            await approveRegistration(pendingUser);
            setNotification({ isOpen: true, message: `${pendingUser.name} has been approved and added as a worker.`, type: "success", title: "Approval Successful" });
            console.log(`Approved registration for ${pendingUser.name} (${pendingUser.id})`);
            fetchAllData();
        },
        'Approve',
        'primary'
    );
  };

  const handleRejectRegistration = (pendingUser) => {
      requestConfirmation(
          'Confirm Rejection',
          `Are you sure you want to reject the registration for ${pendingUser.name}? This action cannot be undone.`,
          async () => {
              await rejectRegistration(pendingUser);
              setNotification({ isOpen: true, message: `Registration for ${pendingUser.name} has been rejected.`, type: "info", title: "Rejection Successful" });
              console.log(`Rejected registration for ${pendingUser.name} (${pendingUser.id})`);
              fetchAllData();
          },
          'Reject',
          'danger'
      );
  };

  const requestSort = (key) => {
    let order = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }
    setSortConfig({ key, order });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
        return <i className={`bi bi-arrow-down-up ${styles.sortIcon} ${styles.sortIconInactive}`}></i>;
    }
    return sortConfig.order === 'asc' 
        ? <i className={`bi bi-arrow-up ${styles.sortIcon}`}></i> 
        : <i className={`bi bi-arrow-down ${styles.sortIcon}`}></i>;
  };

  const sortedAndFilteredUsers = useMemo(() => {
    const safeSearchTerm = (searchTerm || '').toLowerCase();
    
    let filtered = users.filter(user => {
      const roleMatch = activeFilters.role === 'All' || user.role === activeFilters.role;
      const branchMatch = activeFilters.branch === 'All' || (Array.isArray(user.branches) && user.branches.some(b => b === activeFilters.branch));
      return roleMatch && branchMatch;
    });

    if (safeSearchTerm) {
      const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(safeSearchTerm) ||
        user.contact?.toLowerCase().includes(safeSearchTerm) ||
        (user.dateAdded && user.dateAdded.toLocaleDateString('en-US', dateOptions).toLowerCase().includes(safeSearchTerm))
      );
    }

    filtered.sort((a, b) => {
      if (a.role === 'Admin' && b.role !== 'Admin') return -1;
      if (a.role !== 'Admin' && b.role === 'Admin') return 1;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }
      }
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchTerm, activeFilters, sortConfig]);

  const mainContentStyle = {
    marginLeft: isSidebarExpanded ? '260px' : '70px',
  };
  
  const renderPendingTableBody = () => {
      if (isLoading) {
          return <tr><td colSpan="6" className="text-center">Loading...</td></tr>;
      }
      if (pendingUsers.length === 0) {
          return <tr><td colSpan="6" className="text-center">No pending registrations.</td></tr>;
      }
      return pendingUsers.map((user, index) => (
          <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.name}</td>
              <td>{user.phone}</td>
              <td>{user.branchName}</td>
              <td>{user.dateRegistered ? user.dateRegistered.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
              <td>
                <button
                    className="btn btn-sm btn-outline-success me-2"
                    title="Approve Registration"
                    onClick={() => handleApproveRegistration(user)}
                >
                    <i className="bi bi-check-lg"></i> Approve
                </button>
                <button
                    className="btn btn-sm btn-outline-danger"
                    title="Reject Registration"
                    onClick={() => handleRejectRegistration(user)}
                >
                    <i className="bi bi-x-lg"></i> Reject
                </button>
              </td>
          </tr>
      ));
  };

  const renderTableBody = () => {
    if (isLoading) {
      return <tr><td colSpan="7" className="text-center">Loading users...</td></tr>;
    }
    if (error) {
      return <tr><td colSpan="7" className="text-center text-danger">Error: {error}</td></tr>;
    }
    if (sortedAndFilteredUsers.length === 0) {
      return <tr><td colSpan="7" className="text-center">No users found matching your criteria.</td></tr>;
    }
    
    const currentUser = auth.currentUser;

    return sortedAndFilteredUsers.map((user, index) => {
      const isCurrentUser = currentUser && user.role === 'Admin' && user.id === currentUser.email;

      return (
        <tr key={user.id}>
          <td>{index + 1}</td>
          <td>{user.name}</td>
          <td>{user.contact}</td>
          <td>
            <span className={`badge ${user.role === 'Admin' ? 'bg-primary' : 'bg-secondary'}`}>
              {user.role}
            </span>
          </td>
          <td>{user.branches.join(', ')}</td>
          <td>
            {user.dateAdded 
              ? user.dateAdded.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : <span className={styles.notApplicable}>N/A</span>
            }
          </td>
          <td className="text-nowrap">
            {user.role !== 'Admin' && (
              <button
                className="btn btn-sm btn-outline-primary me-2"
                title="Edit User"
                onClick={() => handleOpenEditModal(user)}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-danger"
              title={isCurrentUser ? "You cannot delete your own account" : "Delete User"}
              onClick={() => handleDeleteUser(user)}
              disabled={isCurrentUser}
            >
              <i className="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className={styles.wrapper}>
      <Sidebar isExpanded={isSidebarExpanded} toggleSidebar={toggleSidebar} />
      <main className={`${styles.mainContent} ${pageBlur ? styles.pageBlurred : ''}`} style={mainContentStyle}>
        <div className="container-fluid py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className={styles.pageHeader}>
              <h1><i className="bi bi-people-fill me-2"></i>Workers</h1>
              <p className={`${styles.textMuted} mb-0`}>Oversee all workers and admins, and manage branch access.</p>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-4">
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconBgPrimary}`}>
                  <i className="bi bi-person-badge"></i>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{workerCount}</span>
                  <span className={styles.statLabel}>Total Workers</span>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className={styles.statCard}>
                <div className={`${styles.statIcon} ${styles.iconBgSuccess}`}>
                  <i className="bi bi-person-video3"></i>
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{adminCount}</span>
                  <span className={styles.statLabel}>Total Admins</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`${styles.card} ${styles.pendingCard} mb-4`}>
            <div className={`${styles.cardHeader} d-flex justify-content-between align-items-center`}>
              <h5><i className="bi bi-person-plus-fill"></i>Pending Registrations</h5>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate('/settings')}
                title="Go to settings to change the mobile app registration key"
              >
                <i className="bi bi-key-fill me-1"></i> Register Key
              </button>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.tableResponsive}>
                  <table className={`table table-hover align-middle ${styles.userTable}`}>
                      <thead className="table-light">
                          <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Phone Number</th>
                              <th>Branch</th>
                              <th>Date Registered</th>
                              <th className='text-center'>Actions</th>
                          </tr>
                      </thead>
                      <tbody>{renderPendingTableBody()}</tbody>
                  </table>
              </div>
            </div>
          </div>

          <div className={`${styles.controlsHeader} d-flex justify-content-between align-items-center my-4 p-3 bg-white rounded shadow-sm`}>
            <div className={styles.searchContainer}>
              <i className={`bi bi-search ${styles.searchIcon}`}></i>
              <input
                type="text"
                className={`form-control ${styles.searchInput}`}
                placeholder="Search Workers (Name, Email, Number, Branch, Date)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button
              className={`btn btn-primary ${styles.quickActionBtn}`}
              onClick={handleOpenAddModal}
              disabled={isLoading}
            >
              <i className="bi bi-plus-lg"></i> Add User
            </button>
          </div>

          <div className={styles.filterContainer}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Role:</span>
              <button className={`${styles.filterButton} ${activeFilters.role === 'All' ? styles.active : ''}`} onClick={() => handleFilterChange('role', 'All')}>All</button>
              <button className={`${styles.filterButton} ${activeFilters.role === 'Worker' ? styles.active : ''}`} onClick={() => handleFilterChange('role', 'Worker')}>Workers</button>
              <button className={`${styles.filterButton} ${activeFilters.role === 'Admin' ? styles.active : ''}`} onClick={() => handleFilterChange('role', 'Admin')}>Admins</button>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Branch:</span>
              <select
                className={styles.filterDropdown}
                value={activeFilters.branch}
                onChange={(e) => handleFilterChange('branch', e.target.value)}
                disabled={isLoading}
              >
                <option value="All">All Branches</option>
                {branches
                  .filter(branch => branch && branch.name)
                  .map(branch => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`${styles.card} ${styles.approvedCard} mb-5`}>
            <div className={styles.cardHeader}>
              <h5><i className="bi bi-person-check-fill"></i>Workers</h5>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.tableResponsive}>
                <table className={`table table-hover align-middle ${styles.userTable}`}>
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th className={styles.sortableHeader} onClick={() => requestSort('name')}>
                        Name {getSortIcon('name')}
                      </th>
                      <th>Email / Phone Number</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th className={styles.sortableHeader} onClick={() => requestSort('dateAdded')}>
                        Date Added {getSortIcon('dateAdded')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>{renderTableBody()}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitUserForm}
        currentUser={currentUserForModal}
        isLoading={isSubmittingModal}
        branches={branches}
      />
      <NotificationModal {...notification} onClose={handleCloseNotification} />
      <ConfirmationModal {...confirmationState} onClose={handleCloseConfirmation} onConfirm={confirmationState.onConfirmAction} />
      <DeleteKeyModal
        isOpen={isDeleteKeyModalOpen}
        onClose={handleCloseDeleteKeyModal}
        onSubmit={handleSubmitDeleteKey}
        userName={userToDelete?.name || ''}
        isProcessing={isProcessingDeleteKey}
      />
    </div>
  );
};

export default WorkersPage;