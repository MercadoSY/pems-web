import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  collection,
  query,
  where,
  documentId,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';
import { db, functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const encodeEmail = (email) => email.replace(/\./g, ',');
const decodeEmail = (encodedKey) => encodedKey.replace(/,/g, '.');

/**
 * Formats a string of phone number digits into "+<country_code> <local_number>" for Firestore.
 * @param {string} digits The phone number as a continuous string of digits (e.g., "639123456789").
 * @returns {string} The formatted phone number (e.g., "+63 9123456789").
 */
const formatPhoneNumberForFirestore = (digits) => {
  if (!digits || typeof digits !== 'string') return '';
  // List of known country codes based on UserModal. Sorted by length descending for correct matching.
  const countryCodes = ['971', '966', '63', '61', '65', '44', '1'];
  
  for (const code of countryCodes) {
    if (digits.startsWith(code)) {
      const localPart = digits.substring(code.length);
      return `+${code} ${localPart}`;
    }
  }
  
  // Fallback for any unknown code format, though unlikely with UI validation.
  console.warn(`Could not find a matching country code for phone number digits: ${digits}. Storing with a '+' prefix only.`);
  return `+${digits}`; 
};

// Helper to call the cloud function for deleting a Firebase Auth user.
const deleteAuthUserByPayload = async (payload) => {
  if (!payload.uid && !payload.email && !payload.phoneNumber) {
    throw new Error("UID, email, or phone number must be provided to delete an auth user.");
  }
  try {
    const deleteUserAuth = httpsCallable(functions, 'deleteUserAuthAccount');
    const result = await deleteUserAuth(payload);
    if (!result.data?.success) {
      throw new Error(result.data?.message || "Cloud function failed to delete auth user.");
    }
  } catch (error) {
    console.error("Error calling deleteUserAuthAccount Cloud Function:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Fetches all branch documents from Firestore.
 * @returns {Promise<Array>} A list of branch documents.
 */
export const fetchAllBranches = async () => {
  const branchCollectionRef = collection(db, 'poultryHouses');
  const querySnapshot = await getDocs(branchCollectionRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.id, ...doc.data() }));
};

/**
 * Fetches all pending worker registrations.
 * @returns {Promise<Array>} A list of pending worker registrations with branch names.
 */
export const fetchPendingRegistrations = async () => {
  const pendingQuery = query(collection(db, 'poultryRegister'), where(documentId(), '!=', '0-KEY'));
  const querySnapshot = await getDocs(pendingQuery);
  
  const pendingUsersPromises = querySnapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const dateRegistered = data.dateRegistered ? data.dateRegistered.toDate() : null;
    let branchName = 'N/A';
    
    if (data.branchRef) {
      try {
        const branchDoc = await getDoc(data.branchRef);
        if (branchDoc.exists()) {
          branchName = branchDoc.id;
        }
      } catch (e) {
        console.error("Error fetching branch for pending user:", e);
        branchName = "Error";
      }
    }

    return {
      id: docSnap.id, // Phone number is the ID, expected to be formatted "+CC NNN..."
      phone: docSnap.id, // Ensure phone property matches the ID format for consistency.
      ...data,
      dateRegistered,
      branchName,
    };
  });

  return Promise.all(pendingUsersPromises);
};

/**
 * Fetches all approved workers and admins from Firestore.
 * @returns {Promise<Array>} A list of all approved workers and admins.
 */
export const fetchAllUsersAndAdmins = async () => {
  const allUsers = [];

  const adminsDocRef = doc(db, 'poultryWorkers', 'Admins');
  const adminsDocSnap = await getDoc(adminsDocRef);
  if (adminsDocSnap.exists()) {
    const adminsData = adminsDocSnap.data();
    for (const encodedEmailKey in adminsData) {
      if (Object.hasOwnProperty.call(adminsData, encodedEmailKey)) {
        const decodedEmail = decodeEmail(encodedEmailKey);
        const adminRecord = adminsData[encodedEmailKey];
        const dateAdded = adminRecord.dateAdded ? adminRecord.dateAdded.toDate() : null;
        allUsers.push({
          id: decodedEmail,
          name: adminRecord.name || decodedEmail,
          contact: decodedEmail,
          role: 'Admin',
          branches: ['All Branches'],
          isAuthUser: true,
          ...adminRecord,
          dateAdded,
        });
      }
    }
  }

  const workersQuery = query(collection(db, 'poultryWorkers'), where(documentId(), '!=', 'Admins'));
  const workersSnapshot = await getDocs(workersQuery);
  const workerPromises = workersSnapshot.docs.map(async (docSnap) => {
    const workerData = docSnap.data();
    const branchRefs = workerData.branch || [];
    
    const branchNames = await Promise.all(
      branchRefs.map(async (ref) => {
        try {
          const branchDoc = await getDoc(ref);
          return branchDoc.exists() ? branchDoc.id : 'Unknown Branch';
        } catch {
          return 'Error Branch';
        }
      })
    );

    const dateAdded = workerData.dateAdded ? workerData.dateAdded.toDate() : null;

    return {
      id: docSnap.id,
      name: workerData.name || 'N/A',
      contact: docSnap.id,
      role: 'Worker',
      branches: branchNames.length > 0 ? branchNames : ['No branch assigned'],
      branchRefs: branchRefs,
      isAuthUser: false,
      ...workerData,
      dateAdded,
    };
  });
  
  const workersList = await Promise.all(workerPromises);
  allUsers.push(...workersList);

  return allUsers;
};

/**
 * Calls a Cloud Function to create a new admin user without affecting the current session.
 * @param {string} name The admin's full name.
 * @param {string} email The admin's email address.
 * @param {string} password The admin's password.
 */
export const createAdmin = async (name, email, password) => {
  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required for admins.");
  }
  
  try {
    const createAdminUser = httpsCallable(functions, 'createAdminUser');
    const result = await createAdminUser({ name, email, password });
    if (!result.data.success) {
      throw new Error(result.data.message || 'Failed to create admin via Cloud Function.');
    }
    console.log(`Admin user creation initiated for: ${email}`);
  } catch (error) {
    console.error("Error calling createAdminUser function:", error);
    // The callable function throws an error with a 'message' property
    throw new Error(error.message || "An unknown error occurred while creating the admin.");
  }
};

/**
 * Creates a new worker record in Firestore.
 * @param {string} name The worker's full name.
 * @param {string} phoneNumber The worker's phone number as raw digits (e.g., '639...').
 * @param {string} branchId The ID of the branch to assign the worker to.
 */
export const createWorker = async (name, phoneNumber, branchId) => {
  if (!name || !phoneNumber || !branchId) throw new Error("Name, phone number, and branch are required for workers.");

  const formattedPhoneNumber = formatPhoneNumberForFirestore(phoneNumber);
  const workerDocRef = doc(db, 'poultryWorkers', formattedPhoneNumber);
  const workerDocSnap = await getDoc(workerDocRef);

  if (workerDocSnap.exists()) {
    throw new Error(`A worker with the phone number "${formattedPhoneNumber}" already exists.`);
  }
  
  const branchDocRef = doc(db, 'poultryHouses', branchId);
  const batch = writeBatch(db);

  batch.set(workerDocRef, {
    name,
    branch: [branchDocRef],
    dateAdded: serverTimestamp(),
    deviceTokens: []
  });

  batch.update(branchDocRef, {
    workers: arrayUnion(workerDocRef)
  });

  await batch.commit();
  console.log(`Created new worker record for ${name} with phone ${formattedPhoneNumber}`);
};

/**
 * Deletes an admin from Firestore and Firebase Auth.
 * @param {string} email The email of the admin to delete.
 */
export const deleteAdmin = async (email) => {
  const adminsDocRef = doc(db, 'poultryWorkers', 'Admins');
  const encodedEmail = encodeEmail(email);

  await updateDoc(adminsDocRef, { [encodedEmail]: deleteField() });
  console.log(`Deleted admin Firestore record for: ${email}`);

  try {
    await deleteAuthUserByPayload({ email });
    console.log(`Deleted admin Auth account for: ${email}`);
  } catch (error) {
    console.error(`Failed to delete Auth account for ${email}. It must be deleted manually.`);
    throw new Error(`Firestore data deleted, but failed to delete Auth account: ${error.message}. Please delete it manually from the Firebase Console.`);
  }
};

/**
 * Deletes a worker from Firestore.
 * @param {string} workerId The formatted phone number (ID) of the worker to delete.
 */
export const deleteWorker = async (workerId) => {
  const workerDocRef = doc(db, 'poultryWorkers', workerId);
  const workerSnap = await getDoc(workerDocRef);

  if (!workerSnap.exists()) { throw new Error("Worker not found."); }

  const workerData = workerSnap.data();
  const batch = writeBatch(db);

  if (workerData.branch && Array.isArray(workerData.branch)) {
    workerData.branch.forEach(branchRef => {
      batch.update(branchRef, {
        workers: arrayRemove(workerDocRef)
      });
    });
  }

  batch.delete(workerDocRef);
  await batch.commit();
  console.log(`Deleted worker with ID: ${workerId}`);
};

/**
 * Updates an existing worker's details.
 * @param {string} originalPhoneNumber The worker's current phone number ID.
 * @param {object} newData The new data for the worker.
 */
export const updateWorker = async (originalPhoneNumber, newData) => {
    const { name, phoneNumber, branchId } = newData; // `phoneNumber` is raw digits.
    if (!name || !phoneNumber || !branchId) {
        throw new Error("Name, phone number, and branch are required for update.");
    }

    const formattedNewPhoneNumber = formatPhoneNumberForFirestore(phoneNumber);
    const batch = writeBatch(db);
    const oldWorkerRef = doc(db, 'poultryWorkers', originalPhoneNumber);
    const oldWorkerSnap = await getDoc(oldWorkerRef);

    if (!oldWorkerSnap.exists()) throw new Error("Original worker not found.");
    
    const oldData = oldWorkerSnap.data();
    const oldBranchRefs = oldData.branch || [];
    const newBranchRef = doc(db, 'poultryHouses', branchId);

    if (originalPhoneNumber !== formattedNewPhoneNumber) {
        const newWorkerRef = doc(db, 'poultryWorkers', formattedNewPhoneNumber);
        const newWorkerSnap = await getDoc(newWorkerRef);
        if (newWorkerSnap.exists()) {
            throw new Error(`A worker with the phone number "${formattedNewPhoneNumber}" already exists.`);
        }

        const newWorkerData = { ...oldData, name, branch: [newBranchRef] };
        batch.set(newWorkerRef, newWorkerData);
        batch.delete(oldWorkerRef);

        oldBranchRefs.forEach(ref => {
            batch.update(ref, { workers: arrayRemove(oldWorkerRef) });
        });
        batch.update(newBranchRef, { workers: arrayUnion(newWorkerRef) });
        console.log(`Updated worker, phone changed from ${originalPhoneNumber} to ${formattedNewPhoneNumber}`);
    } else {
        batch.update(oldWorkerRef, { name, branch: [newBranchRef] });
        const oldBranchPath = oldBranchRefs.length > 0 ? oldBranchRefs[0].path : null;
        if (oldBranchPath !== newBranchRef.path) {
            batch.update(newBranchRef, { workers: arrayUnion(oldWorkerRef) });
            if (oldBranchPath) {
                batch.update(doc(db, oldBranchPath), { workers: arrayRemove(oldWorkerRef) });
            }
        }
        console.log(`Updated worker details for ${originalPhoneNumber}`);
    }

    await batch.commit();
};

/**
 * Fetches details for a specific admin user by email.
 * @param {string} email The admin's email.
 * @returns {Promise<object|null>} The admin's data object or null if not found.
 */
export const fetchAdminDetails = async (email) => {
    if (!email) return null;
    try {
        const adminsDocRef = doc(db, 'poultryWorkers', 'Admins');
        const adminsDocSnap = await getDoc(adminsDocRef);

        if (adminsDocSnap.exists()) {
            const adminsData = adminsDocSnap.data();
            const encodedEmail = encodeEmail(email);
            if (adminsData && Object.prototype.hasOwnProperty.call(adminsData, encodedEmail)) {
                return adminsData[encodedEmail];
            }
        }
    } catch (error) {
        console.error("Error fetching admin details:", error);
    }
    return null;
};

/**
 * Updates an admin's name in Firestore.
 * @param {string} email The admin's email.
 * @param {string} newName The new name for the admin.
 */
export const updateAdminName = async (email, newName) => {
    if (!email || !newName || typeof newName !== 'string' || newName.trim().length === 0) {
        throw new Error("A valid email and a non-empty name are required.");
    }

    const adminsDocRef = doc(db, 'poultryWorkers', 'Admins');
    const encodedEmail = encodeEmail(email);
    
    await updateDoc(adminsDocRef, {
        [`${encodedEmail}.name`]: newName.trim()
    });
};


// --- Callable Function Wrappers for Registration ---

/**
 * Approves a registration via a cloud function and deletes the temporary auth user.
 * @param {object} pendingUser The pending user object, containing id (formatted phone number).
 */
export const approveRegistration = async (pendingUser) => {
    const phoneNumber = pendingUser.id;
    if (!phoneNumber) throw new Error("Phone number is required to approve registration.");
    
    console.log(`Approving registration for ${phoneNumber}`);
    const approveFunction = httpsCallable(functions, 'approveRegistration');
    const result = await approveFunction({ phoneNumber });

    try {
        // For Auth, number must be in E.164 format (e.g., +63912...). Remove spaces.
        const phoneNumberForAuth = phoneNumber.replace(/\s/g, '');
        await deleteAuthUserByPayload({ phoneNumber: phoneNumberForAuth });
        console.log(`Deleted temporary auth user for ${phoneNumber}`);
    } catch (error) {
        console.warn(`User ${phoneNumber} approved, but failed to delete temporary auth account. Please do it manually. Error: ${error.message}`);
    }
    
    return result;
};

/**
 * Rejects a pending registration from Firestore and Firebase Auth.
 * @param {object} pendingUser The pending user object, containing id (formatted phone number).
 */
export const rejectRegistration = async (pendingUser) => {
    const phoneNumber = pendingUser.id;
    if (!phoneNumber) throw new Error("Phone number is required to reject a registration.");
    
    const pendingDocRef = doc(db, 'poultryRegister', phoneNumber);
    await deleteDoc(pendingDocRef);
    console.log(`Rejected (deleted) pending registration for ${phoneNumber} from Firestore.`);
    
    try {
        // For Auth, number must be in E.164 format (e.g., +63912...). Remove spaces.
        const phoneNumberForAuth = phoneNumber.replace(/\s/g, '');
        await deleteAuthUserByPayload({ phoneNumber: phoneNumberForAuth });
        console.log(`Deleted temporary auth user for rejected registration: ${phoneNumber}`);
    } catch (error) {
        if (error.message.includes("not found")) {
            console.warn(`Could not find auth user for ${phoneNumber} to delete. It might have been already deleted or never existed.`);
        } else {
            throw new Error(`Registration rejected from Firestore, but failed to delete auth account: ${error.message}. Please delete it manually from the Firebase Console.`);
        }
    }
};

/**
 * Fetches the registration key from Firestore.
 * @returns {Promise<string>} The current registration key.
 */
export const fetchRegisterKey = async () => {
    const keyDocRef = doc(db, 'poultryRegister', '0-KEY');
    const docSnap = await getDoc(keyDocRef);
    if (docSnap.exists() && docSnap.data().registerKey) {
        return docSnap.data().registerKey;
    }
    return '';
};

/**
 * Fetches the admin deletion key from Firestore.
 * @returns {Promise<string>} The delete key.
 */
export const fetchDeleteKey = async () => {
    const keyDocRef = doc(db, 'deleteKey', 'key');
    const docSnap = await getDoc(keyDocRef);
    if (docSnap.exists() && docSnap.data().KEY) {
        return docSnap.data().KEY;
    }
    console.error("Admin delete key is not configured in Firestore. Path: deleteKey/key, Field: KEY");
    throw new Error("Admin delete key is not configured in Firestore. Deletion is disabled.");
};

/**
 * Updates the registration key in Firestore.
 * @param {string} newKey The new registration key.
 */
export const updateRegisterKey = async (newKey) => {
    if (typeof newKey !== 'string') throw new Error("Register key must be a string.");
    const keyDocRef = doc(db, 'poultryRegister', '0-KEY');
    await setDoc(keyDocRef, { registerKey: newKey }, { merge: true });
};