import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '../components/layout/Sidebar';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import NotificationModal from '../components/modals/NotificationModal';
import styles from '../styles/HistoryLogsPage.module.css';
import { fetchHistoryLogs, deleteHistoryLogs } from '../firebase/history';

/** Renders the History Logs page with performant filtering, searching, windowing, and deletion capabilities. */
export default function HistoryLogsPage() {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters and Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    
    // Selection and Deletion State
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [logsToDelete, setLogsToDelete] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Notification State
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    // Pagination/Windowing State for Performance
    const [visibleCount, setVisibleCount] = useState(50);
    const observer = useRef();

    const toggleSidebar = () => setIsSidebarExpanded((prev) => !prev);

    useEffect(() => {
        let isMounted = true;
        const loadLogs = async () => {
            setIsLoading(true);
            const fetchedLogs = await fetchHistoryLogs();
            if (isMounted) {
                setLogs(fetchedLogs);
                setIsLoading(false);
            }
        };
        loadLogs();
        return () => { isMounted = false; };
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = 
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.user.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesFilter = filterType === 'All' || log.type === filterType;
            
            return matchesSearch && matchesFilter;
        });
    }, [logs, searchQuery, filterType]);

    useEffect(() => {
        setVisibleCount(50);
    }, [searchQuery, filterType]);

    const lastLogElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < filteredLogs.length) {
                setVisibleCount(prevCount => prevCount + 50);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, visibleCount, filteredLogs.length]);

    const handleSelectLog = (id) => {
        setSelectedLogs(prev => 
            prev.includes(id) ? prev.filter(logId => logId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLogs(filteredLogs.map(log => log.id));
        } else {
            setSelectedLogs([]);
        }
    };

    const initiateDelete = (ids) => {
        setLogsToDelete(ids);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteHistoryLogs(logsToDelete);
            setLogs(prev => prev.filter(log => !logsToDelete.includes(log.id)));
            setSelectedLogs(prev => prev.filter(id => !logsToDelete.includes(id)));
            
            setNotification({
                isOpen: true,
                title: 'Success',
                message: `Successfully deleted ${logsToDelete.length > 1 ? `${logsToDelete.length} history logs` : 'the history log'}.`,
                type: 'success'
            });
        } catch (error) {
            setNotification({
                isOpen: true,
                title: 'Deletion Failed',
                message: 'An error occurred while deleting the logs. Please try again.',
                type: 'error'
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setLogsToDelete([]);
        }
    };

    const getBadgeClass = (type) => {
        switch (type) {
            case 'Add': return styles.badgeAdd;
            case 'Update': return styles.badgeUpdate;
            case 'Delete': return styles.badgeDelete;
            default: return styles.badgeSystem;
        }
    };

    const visibleLogs = filteredLogs.slice(0, visibleCount);

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
                    <header className={styles.pageHeader}>
                        <h1 className={styles.title}>
                            <span className={styles.iconSpan}>
                                <i className="bi bi-clock-history fs-2"></i>
                            </span>
                            History Logs
                        </h1>
                        <p>View, filter, and manage recent system activities</p>
                    </header> 
                    
                    <div className={styles.controlsContainer}>
                        <div className={styles.searchFilterGroup}>
                            <div className={styles.searchWrapper}>
                                <i className="bi bi-search"></i>
                                <input 
                                    type="text" 
                                    placeholder="Search logs by action or user..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                    aria-label="Search logs"
                                />
                            </div>
                            <select 
                                value={filterType} 
                                onChange={(e) => setFilterType(e.target.value)}
                                className={styles.filterSelect}
                                aria-label="Filter by type"
                            >
                                <option value="All">All Types</option>
                                <option value="Add">Add</option>
                                <option value="Update">Update</option>
                                <option value="Delete">Delete</option>
                                <option value="System">System</option>
                            </select>
                        </div>

                        {selectedLogs.length > 0 && (
                            <button 
                                className={styles.bulkDeleteBtn} 
                                onClick={() => initiateDelete(selectedLogs)}
                                aria-label={`Delete ${selectedLogs.length} selected logs`}
                            >
                                <i className="bi bi-trash"></i>
                                Delete Selected ({selectedLogs.length})
                            </button>
                        )}
                    </div>

                    <div className={styles.logsContainer}>
                        {isLoading ? (
                            <div className={styles.emptyMessage}>
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading history logs...</p>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <p className="mt-2">No history logs match your search criteria.</p>
                            </div>
                        ) : (
                            <div className={styles.logsList}>
                                <div className={styles.listHeader}>
                                    <input 
                                        type="checkbox" 
                                        className={styles.checkbox}
                                        checked={selectedLogs.length === filteredLogs.length && filteredLogs.length > 0}
                                        onChange={handleSelectAll}
                                        aria-label="Select all logs"
                                    />
                                    <span className={styles.headerLabel}>Select All</span>
                                    <span className={styles.totalCountBadge}>{filteredLogs.length} Records</span>
                                </div>
                                
                                {visibleLogs.map((log, index) => {
                                    const isLastElement = index === visibleLogs.length - 1;
                                    return (
                                        <article 
                                            key={log.id} 
                                            className={styles.logCard}
                                            ref={isLastElement ? lastLogElementRef : null}
                                        >
                                            <div className={styles.logLeft}>
                                                <input 
                                                    type="checkbox" 
                                                    className={styles.checkbox}
                                                    checked={selectedLogs.includes(log.id)}
                                                    onChange={() => handleSelectLog(log.id)}
                                                    aria-label={`Select log ${log.action}`}
                                                />
                                            </div>
                                            
                                            <div className={styles.logInfo}>
                                                <div className={styles.badgeWrapper}>
                                                    <span className={`${styles.badge} ${getBadgeClass(log.type)}`}>
                                                        {log.type}
                                                    </span>
                                                </div>
                                                <div className={styles.logMain}>
                                                    <h3 className={styles.logAction}>{log.action}</h3>
                                                </div>
                                                <div className={styles.logMeta}>
                                                    <span className={styles.highlightUser}>
                                                        <i className="bi bi-person-badge"></i>
                                                        <span className="ms-1">{log.user}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className={styles.logActions}>
                                                <div className={styles.highlightDate}>
                                                    <i className="bi bi-calendar3"></i>
                                                    <span className="ms-2">{log.timestamp}</span>
                                                </div>
                                                <button 
                                                    className={styles.iconBtn} 
                                                    onClick={() => initiateDelete([log.id])}
                                                    title="Delete Log"
                                                    aria-label="Delete specific log"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete History Logs"
                message={`Are you sure you want to delete ${logsToDelete.length > 1 ? `these ${logsToDelete.length} logs` : 'this log'}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isProcessing={isDeleting}
                confirmButtonType="danger"
            />

            <NotificationModal
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                message={notification.message}
                type={notification.type}
            />
        </div>
    );
}