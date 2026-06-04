import { db, auth } from './firebaseConfig';
import { collection, doc, setDoc, getDocs, getDoc, Timestamp, query, orderBy, writeBatch } from 'firebase/firestore';

/**
 * Formats a given date to match the required document ID format: MMM-DD-YYYY-hh:mmA
 * Example: May-26-2026-06:31PM
 * Appends a small random string to avoid overwriting logs occurring in the same minute.
 * @param {Date} dateObj - The date to format.
 * @returns {string} The formatted document ID.
 */
const formatHistoryDocId = (dateObj) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()];
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strHours = String(hours).padStart(2, '0');
    const strMinutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${month}-${day}-${year}-${strHours}:${strMinutes}${ampm}-${randomSuffix}`;
};

/**
 * Infers the action type based on keywords in the description.
 * @param {string} description - The action description.
 * @returns {string} The inferred type (Add, Update, Delete, System).
 */
const inferActionType = (description) => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('creat') || lowerDesc.includes('add')) return 'Add';
    if (lowerDesc.includes('updat') || lowerDesc.includes('chang') || lowerDesc.includes('approv') || lowerDesc.includes('acknowledg')) return 'Update';
    if (lowerDesc.includes('delet') || lowerDesc.includes('remov') || lowerDesc.includes('reject') || lowerDesc.includes('clear')) return 'Delete';
    return 'System';
};

/**
 * Logs a system action to the Firestore 'history' collection.
 * @param {string} actionDesc - A description of the action performed.
 * @param {string} [type] - Optional explicitly defined type (Add, Update, Delete, etc.).
 * @returns {Promise<void>}
 */
export const logAction = async (actionDesc, type = null) => {
    try {
        const user = auth.currentUser;
        const userId = user?.email || user?.phoneNumber || user?.uid || 'System';
        const userRef = doc(db, 'workers', userId); 
        
        const now = new Date();
        const docId = formatHistoryDocId(now);
        const actionType = type || inferActionType(actionDesc);
        
        await setDoc(doc(db, 'history', docId), {
            action: actionDesc,
            type: actionType,
            date: Timestamp.fromDate(now),
            user: userRef
        });
    } catch (error) {
        console.error("Failed to log action to history:", error);
    }
};

/**
 * Fetches all history logs from the Firestore 'history' collection.
 * Includes caching to optimize resolving user references into human-readable names.
 * @returns {Promise<Array>} Array of log objects sorted by date descending.
 */
export const fetchHistoryLogs = async () => {
    try {
        const historyRef = collection(db, 'history');
        const q = query(historyRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        
        const userCache = {}; // Cache to prevent duplicate DB calls for the same user
        
        const logsPromises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const d = data.date?.toDate() || new Date();
            
            const timestampStr = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
            
            let userName = 'System';
            if (data.user?.path) {
                const path = data.user.path;
                if (userCache[path] === undefined) {
                    try {
                        const userDoc = await getDoc(data.user);
                        userCache[path] = userDoc.exists() && userDoc.data().name 
                            ? userDoc.data().name 
                            : path.split('/').pop().replace(/,/g, '.');
                    } catch (e) {
                        userCache[path] = path.split('/').pop().replace(/,/g, '.');
                    }
                }
                userName = userCache[path];
            }

            const actionDesc = data.action || 'Unknown Action';

            return {
                id: docSnap.id,
                action: actionDesc,
                type: data.type || inferActionType(actionDesc),
                user: userName,
                timestamp: timestampStr
            };
        });
        
        return await Promise.all(logsPromises);
    } catch (error) {
        console.error("Failed to fetch history logs:", error);
        return [];
    }
};

/**
 * Deletes multiple history logs from Firestore in a batch.
 * @param {string[]} logIds - Array of document IDs to delete.
 * @returns {Promise<void>}
 */
export const deleteHistoryLogs = async (logIds) => {
    if (!logIds || logIds.length === 0) return;
    try {
        const batch = writeBatch(db);
        logIds.forEach(id => {
            batch.delete(doc(db, 'history', id));
        });
        await batch.commit();
    } catch (error) {
        console.error("Failed to delete history logs:", error);
        throw error;
    }
};