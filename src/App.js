/* global __app_id __initial_auth_token */ // ESLint directive for global variables

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Droplets, Target, BookOpen, Footprints, Moon, Sun, CheckCircle2, Circle, TrendingUp, User, LogOut, UserPlus, LogIn } from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// --- CUSTOM UI COMPONENTS (REMOVED) ---
// MagicBento and Folder components have been removed as requested.
// You can delete src/components/MagicBento.js, src/components/MagicBento.css, and src/components/Folder.js if you wish.
// --- END CUSTOM UI COMPONENTS ---

// Default daily tasks for new users or resetting
const defaultDailyTasks = {
  wakeUp4am: false,
  morningJournal: false,
  exercise5am: false,
  water1L: false,
  noCoffeePhone: false,
  threeMeals: false,
  water2to3L: false,
  walk8k: false,
  eveningJournal: false,
  noPhoneAfter8: false
};

const Hard75Tracker = () => {
  // --- FIREBASE STATE & INITIALIZATION ---
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null); // Firebase User ID
  const [userEmail, setUserEmail] = useState(null); // Firebase User Email
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false); // Tracks if Firebase is initialized and auth state checked

  // Global variables for Firebase config and app ID (provided by Canvas environment or default)
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-hard75-app';
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  // IMPORTANT: This is YOUR Firebase Config object from Firebase Console
  // Wrapped firebaseConfig in useMemo to make its reference stable
  const firebaseConfig = useMemo(() => ({
    apiKey: "AIzaSyB53jW0t_iH_eKkp_ag64-9lTL4g6vFR_k",
    authDomain: "hard75-9af5d.firebaseapp.com",
    projectId: "hard75-9af5d",
    storageBucket: "hard75-9af5d.firebasestorage.app",
    messagingSenderId: "558920238295",
    appId: "1:558920238295:web:5ac2208f004100e69a1c92",
    measurementId: "G-N6053L3KP9"
  }), []); // Empty dependency array means it's created once

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);
      // eslint-disable-next-line no-unused-vars
      const analyticsInstance = getAnalytics(app); // Initialize Analytics, no need to store in a variable if not used directly

      setAuth(authInstance);
      setDb(dbInstance);

      // Attempt to sign in with custom token or anonymously first
      const signInInitialUser = async () => {
        try {
          // If a custom token is provided (typically in Canvas environment), try to use it.
          // Otherwise, proceed directly to anonymous sign-in.
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
            console.log("Signed in with custom token.");
          } else {
            // If no custom token, or if previous sign-in failed, attempt anonymous sign-in.
            // This is the primary path for local development.
            await signInAnonymously(authInstance);
            console.log("Signed in anonymously.");
          }
        } catch (error) {
          console.error("Initial Firebase sign-in attempt failed:", error);
          showMessage(`Initial sign-in failed: ${error.message}. Please ensure your Firebase project's Authentication providers (Email/Password, Anonymous) are enabled and your API key is correct for web apps. Then try signing up or logging in.`, 'error');
          setIsFirebaseReady(true); // Unblock UI even if auth fails
          setIsLoading(false);
        }
      };
      signInInitialUser();

      // Set up authentication state observer
      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          setUserEmail(user.email);
          setIsAuthenticated(true);
          console.log("Firebase Auth State Changed: User is authenticated.", user.uid);
        } else {
          setUserId(null);
          setUserEmail(null);
          setIsAuthenticated(false);
          console.log("Firebase Auth State Changed: User is NOT authenticated.");
        }
        setIsFirebaseReady(true); // Firebase is ready and auth state has been checked
      });

      // eslint-disable-next-line no-unused-vars
      return () => unsubscribe(); // Cleanup auth listener on unmount
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      setIsFirebaseReady(true); // Mark ready even on error to unblock UI
      showMessage(`Firebase initialization failed: ${error.message}`, 'error');
    }
  }, [firebaseConfig, initialAuthToken]); // Added firebaseConfig and initialAuthToken to dependencies

  // --- APP STATE (LOADED FROM FIRESTORE) ---
  const [currentDay, setCurrentDay] = useState(1);
  const [dailyTasks, setDailyTasks] = useState({ ...defaultDailyTasks });
  const [waterIntake, setWaterIntake] = useState(0); // waterIntake state variable
  const [steps, setSteps] = useState(0); // steps state variable
  const [completedDays, setCompletedDays] = useState([]); // Array of completed day numbers
  const [dailyHistory, setDailyHistory] = useState({}); // Stores historical data for each completed day

  // UI states
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '', email: '' });
  const [showJournal, setShowJournal] = useState(false);
  const [journalMode, setJournalMode] = useState('morning'); // 'morning' or 'evening'
  const [message, setMessage] = useState(null); // For displaying user messages (e.g., errors, success)
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(true); // Overall loading state for data
  // eslint-disable-next-line no-unused-vars
  const [showResetConfirm, setShowResetConfirm] = useState(false); // State for reset confirmation modal - added eslint-disable-next-line

  // Journal prompts
  const morningPrompts = [
    "What are 3 things I'm grateful for today?",
    "What is my main focus/priority for today?",
    "What challenges might I face today and how will I overcome them?",
    "How do I want to feel at the end of today?",
    "What is one small win I can achieve today?"
  ];
  const eveningPrompts = [
    "What went well today?",
    "What could I have done better?",
    "What did I learn about myself today?",
    "How did I grow today?",
    "What am I most proud of from today?"
  ];

  // Non-negotiable tasks with their labels and icons
  const nonNegotiables = [
    { key: 'wakeUp4am', label: '4 AM Wake Up', icon: Sun },
    { key: 'morningJournal', label: '5-Prompt Journal (Morning)', icon: BookOpen },
    { key: 'exercise5am', label: 'Exercise 5 AM', icon: Target },
    { key: 'water1L', label: '1L Water before 6 AM', icon: Droplets },
    { key: 'noCoffeePhone', label: 'No Coffee + No Phone 90 mins', icon: Clock },
    { key: 'threeMeals', label: '3 Meals a Day', icon: Target },
    { key: 'water2to3L', label: '2-3L of Water a Day', icon: Droplets },
    { key: 'walk8k', label: 'Walk 8k Steps a Day', icon: Footprints },
    { key: 'eveningJournal', label: '5-Prompt Journal (Evening)', icon: BookOpen },
    { key: 'noPhoneAfter8', label: 'No Phones After 8 PM', icon: Moon }
  ];

  // Function to get today's date string for Firestore document IDs
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Firestore paths - Wrapped in useCallback to make their references stable
  const getUserProfileDocRef = useCallback((uid) => doc(db, `/artifacts/${appId}/users/${uid}/profile_data/user_profile`), [db, appId]);
  const getDailyProgressDocRef = useCallback((uid, dateString) => doc(db, `/artifacts/${appId}/users/${uid}/daily_progress/${dateString}`), [db, appId]);

  // Effect to load user data from Firestore when authenticated
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated || !db || !userId) {
      // If not authenticated or Firebase not ready, ensure states are reset and loading is true
      setCurrentDay(1);
      setDailyTasks({ ...defaultDailyTasks });
      setWaterIntake(0); // Reset water/steps on auth change
      setSteps(0);       // Reset water/steps on auth change
      setCompletedDays([]);
      setDailyHistory({});
      setIsLoading(true);
      return;
    }

    // Set loading to false once data fetching starts for authenticated users
    setIsLoading(false);

    // eslint-disable-next-line no-unused-vars
    const unsubscribeProfile = onSnapshot(getUserProfileDocRef(userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentDay(data.currentDay || 1);
        setCompletedDays(data.completedDays || []);
        setDailyHistory(data.dailyHistory || {}); // Load historical data
        console.log("Profile data loaded:", data);
      } else {
        // If profile doesn't exist, create a default one
        setDoc(getUserProfileDocRef(userId), {
          currentDay: 1,
          completedDays: [],
          dailyHistory: {},
          email: userEmail // Store email for reference
        }, { merge: true })
        .then(() => console.log("Default profile created."))
        .catch(error => console.error("Error creating default profile:", error));
      }
    }, (error) => {
      console.error("Error listening to user profile:", error);
      showMessage(`Error loading profile: ${error.message}`, 'error');
    });

    // This listener now correctly updates all daily data including water/steps
    const todayDate = getTodayDateString();
    // eslint-disable-next-line no-unused-vars
    const unsubscribeDaily = onSnapshot(getDailyProgressDocRef(userId, todayDate), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDailyTasks(data.dailyTasks || { ...defaultDailyTasks });
        setWaterIntake(data.waterIntake || 0); // Always update waterIntake from Firestore
        setSteps(data.steps || 0);             // Always update steps from Firestore
        console.log("Daily progress loaded:", data);
      } else {
        // If daily progress doesn't exist, create a default one
        setDoc(getDailyProgressDocRef(userId, todayDate), {
          date: todayDate,
          dailyTasks: { ...defaultDailyTasks },
          waterIntake: 0, // Still initialize in Firestore for historical data consistency
          steps: 0        // Still initialize in Firestore for historical data consistency
        }, { merge: true })
        .then(() => console.log("Default daily progress created."))
        .catch(error => console.error("Error creating default daily progress:", error));
      }
    }, (error) => {
      console.error("Error listening to daily progress:", error);
      showMessage(`Error loading daily progress: ${error.message}`, 'error');
    });

    // Removed waterIntake and steps from this useEffect's dependency array
  }, [isFirebaseReady, isAuthenticated, db, userId, userEmail, appId, getUserProfileDocRef, getDailyProgressDocRef]);

  // Effect to persist waterIntake and steps to Firestore whenever they change
  useEffect(() => {
    if (!db || !userId || !isAuthenticated) return; // Only save if authenticated and Firebase is ready
    const todayDate = getTodayDateString();
    const docRef = getDailyProgressDocRef(userId, todayDate);

    // Use a timeout to debounce writes, preventing too many rapid Firestore updates
    const handler = setTimeout(async () => {
      try {
        await setDoc(docRef, { waterIntake: waterIntake, steps: steps }, { merge: true });
        console.log("Water/Steps saved to Firestore:", waterIntake, steps);
      } catch (error) {
        console.error("Error saving water/steps to Firestore:", error);
        showMessage(`Error saving water/steps: ${error.message}`, 'error');
      }
    }, 500); // Debounce by 500ms

    return () => {
      clearTimeout(handler); // Cleanup timeout on unmount or re-render
    };
  }, [waterIntake, steps, db, userId, isAuthenticated, getDailyProgressDocRef]); // Dependencies for this effect


  // Function to display a temporary message to the user
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000); // Message disappears after 3 seconds
  };

  // Handles user sign-up
  const handleSignUp = async () => {
    if (!authForm.username || !authForm.password || !authForm.email) {
      showMessage('Please fill in all fields!', 'error');
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      showMessage('Passwords do not match!', 'error');
      return;
    }
    if (!auth) {
      showMessage('Firebase Auth not initialized.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
      const uid = userCredential.user.uid;

      // Set initial user profile data in Firestore
      await setDoc(getUserProfileDocRef(uid), {
        currentDay: 1,
        completedDays: [],
        dailyHistory: {},
        email: authForm.email,
        username: authForm.username // Store username from form
      });

      // Set initial daily progress for today
      const todayDate = getTodayDateString();
      await setDoc(getDailyProgressDocRef(uid, todayDate), {
        date: todayDate,
        dailyTasks: { ...defaultDailyTasks },
        waterIntake: 0,
        steps: 0
      });

      showMessage('Account created successfully! Please sign in.', 'success');
      setAuthMode('signin'); // Redirect to sign-in
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '' });
    } catch (error) {
      console.error("Sign up failed:", error);
      showMessage(`Sign up failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles user sign-in
  const handleSignIn = async () => {
    if (!authForm.email || !authForm.password) { // Use email for sign-in
      showMessage('Please enter email and password!', 'error');
      return;
    }
    if (!auth) {
      showMessage('Firebase Auth not initialized.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      showMessage('Signed in successfully!', 'success');
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '' });
    } catch (error) {
      console.error("Sign in failed:", error);
      showMessage(`Sign in failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handles user sign-out
  const handleSignOut = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signOut(auth);
      // States will be reset by useEffect onAuthStateChanged
      showMessage('Signed out successfully!', 'success');
    } catch (error) {
      console.error("Sign out failed:", error);
      showMessage(`Sign out failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggles the completion status of a daily task and updates Firestore
  const handleTaskToggle = async (taskKey) => {
    if (!db || !userId) return;
    const todayDate = getTodayDateString();
    const newDailyTasks = { ...dailyTasks, [taskKey]: !dailyTasks[taskKey] };

    try {
      await setDoc(getDailyProgressDocRef(userId, todayDate), { dailyTasks: newDailyTasks }, { merge: true });
      setDailyTasks(newDailyTasks); // Optimistic update
    } catch (error) {
      console.error("Error updating daily task:", error);
      showMessage(`Error updating task: ${error.message}`, 'error');
    }
  };

  // Calculates the percentage of daily tasks completed
  const getCompletionPercentage = () => {
    const totalTasks = Object.values(dailyTasks).length;
    const completedTasks = Object.values(dailyTasks).filter(Boolean).length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  // Checks if all daily tasks are completed (now only based on non-negotiable checkboxes)
  const isDayComplete = () => {
    const allTasksChecked = Object.values(dailyTasks).every(value => value);

    console.log("--- isDayComplete Debug ---");
    console.log("All daily tasks checked:", allTasksChecked);
    console.log("Overall Day Complete:", allTasksChecked); // Simplified
    console.log("-------------------------");

    return allTasksChecked; // Only check if all daily tasks are true
  };

  // Resets all daily tasks, water intake, and steps for the current day, and updates Firestore
  const resetDay = async () => {
    if (!db || !userId) return;
    const todayDate = getTodayDateString();

    try {
      await setDoc(getDailyProgressDocRef(userId, todayDate), {
        dailyTasks: { ...defaultDailyTasks },
        waterIntake: 0,
        steps: 0
      }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist
      showMessage('Daily progress reset!', 'success');
      // Reset local state for current day immediately
      setDailyTasks({ ...defaultDailyTasks });
      setWaterIntake(0);
      setSteps(0);
    } catch (error) {
      console.error("Error resetting daily progress:", error);
      showMessage(`Error resetting progress: ${error.message}`, 'error');
    }
  };

  // Function to reset the entire challenge (all user data)
  const resetChallenge = async () => {
    if (!db || !userId) return;

    // Confirm with the user before proceeding
    const confirmed = window.confirm("Are you sure you want to reset the entire challenge? This will delete all your progress!");
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    try {
      // Reset user profile data in Firestore
      await setDoc(getUserProfileDocRef(userId), {
        currentDay: 1,
        completedDays: [],
        dailyHistory: {},
        email: userEmail // Keep email for re-authentication
      }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist

      // Optionally, you might want to delete all daily_progress documents for this user
      // This requires fetching all documents in the subcollection and deleting them.
      // For simplicity here, we're just resetting the profile and current day.
      // If you need to delete all daily_progress docs, it would involve a query and batch delete.

      // Reset today's daily progress document for the new Day 1
      const todayDate = getTodayDateString();
      await setDoc(getDailyProgressDocRef(userId, todayDate), {
        date: todayDate,
        dailyTasks: { ...defaultDailyTasks },
        waterIntake: 0,
        steps: 0
      }, { merge: true });

      showMessage('Challenge reset successfully! Signing out...', 'success');
      await signOut(auth); // Sign out to force app to reload initial state
    } catch (error) {
      console.error("Error resetting challenge:", error);
      showMessage(`Error resetting challenge: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Marks the current day as complete and advances to the next day, updating Firestore
  const completeDay = async () => {
    if (!db || !userId) return;

    if (isDayComplete()) {
      const newCompletedDays = [...completedDays, currentDay];
      const nextDay = currentDay < 75 ? currentDay + 1 : currentDay;

      // Prepare the daily history entry for the day just completed
      const newDailyHistoryEntry = {
        dailyTasks: { ...dailyTasks }, // Deep copy current daily tasks
        waterIntake: waterIntake, // Include waterIntake from state
        steps: steps,        // Include steps from state
        date: new Date().toISOString()
      };

      try {
        // Update user profile with new currentDay, completedDays, and dailyHistory
        await setDoc(getUserProfileDocRef(userId), {
          currentDay: nextDay,
          completedDays: newCompletedDays,
          dailyHistory: {
            ...dailyHistory, // Preserve existing history
            [currentDay]: newDailyHistoryEntry // Add history for the just completed day
          }
        }, { merge: true });

        // Reset today's daily progress document for the new day
        const todayDate = getTodayDateString();
        await setDoc(getDailyProgressDocRef(userId, todayDate), {
          dailyTasks: { ...defaultDailyTasks },
          waterIntake: 0, // Still initialize in Firestore for historical data consistency
          steps: 0,        // Still initialize in Firestore for historical data consistency
          date: todayDate // Ensure date is set for the new day's document
        }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist

        showMessage(`Day ${currentDay} completed! ${currentDay < 75 ? `Moving to Day ${nextDay}.` : 'Challenge finished!'}`, 'success');

        // Local state updates (will also be triggered by onSnapshot)
        setCurrentDay(nextDay);
        setCompletedDays(newCompletedDays);
        setDailyTasks({ ...defaultDailyTasks });
        setWaterIntake(0); // Reset local water/steps state for new day
        setSteps(0);       // Reset local water/steps state for new day

      } catch (error) {
        console.error("Error completing day:", error);
        showMessage(`Error completing day: ${error.message}`, 'error');
      }
    } else {
      showMessage('Please complete all tasks before completing the day!', 'error');
    }
  };

  // Update water intake in Firestore (now only updates local state)
  const handleWaterChange = (e) => {
    const newWaterIntake = parseFloat(e.target.value) || 0;
    setWaterIntake(newWaterIntake);
  };

  // Update steps in Firestore (now only updates local state)
  const handleStepsChange = (e) => {
    const newSteps = parseInt(e.target.value) || 0;
    setSteps(newSteps);
  };

  // Calculate values for dashboard metrics (now only from dailyHistory, not current day inputs)
  const totalWater = Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.waterIntake || 0), 0);
  const totalSteps = Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.steps || 0), 0);
  const totalTasksCompleted = Object.values(dailyHistory).reduce((total, dayData) => {
    if (!dayData?.dailyTasks) return total;
    const completed = Object.values(dayData.dailyTasks).filter(Boolean).length;
    return total + completed;
  }, 0);


  // Show loading overlay if Firebase is not ready or data is being fetched
  if (!isFirebaseReady || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
        <div className="text-center text-xl font-semibold">
          Loading App...
        </div>
      </div>
    );
  }

  // Render authentication UI if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Hard 75 Challenge</h1>
            <p className="text-gray-300">Track your 75-day transformation journey</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            {message && (
              <div className={`p-3 rounded-lg text-center font-medium mb-4 ${messageType === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                {message}
              </div>
            )}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  authMode === 'signin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  authMode === 'signup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Sign Up
              </button>
            </div>
            <div className="space-y-4">
              {/* For sign-in, use email field */}
              {authMode === 'signin' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              )}
              {/* For sign-up, use username and email fields */}
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                      type="text"
                      value={authForm.username}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={authForm.confirmPassword}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                </div>
              )}
              <button
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
            {/* Removed demo user section as we now have real auth */}
          </div>
        </div>
      </div>
    );
  }

  // Render main tracker UI if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {message && (
          <div className={`p-3 rounded-lg text-center font-medium mb-4 ${messageType === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {message}
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-2">Hard 75 Challenge</h1>
            <div className="text-2xl font-semibold text-blue-300">Day {currentDay} of 75</div>
            <div className="text-lg text-gray-300 mt-2">
              {completedDays.length} days completed • {getCompletionPercentage()}% today
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-300">
                <User className="w-5 h-5" />
                <span className="font-semibold">{userEmail || userId}</span> {/* Display email if available, else UID */}
              </div>
              <div className="text-sm text-gray-400">
                {userId} {/* Display full UID as required by Canvas instructions */}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overall Challenge Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Challenge Progress</span>
            <span>{completedDays.length}/75 days</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(completedDays.length / 75) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Today's Progress Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Today's Progress
          </h2>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
          <div className="text-center text-lg font-semibold">
            {getCompletionPercentage()}% Complete
          </div>
        </div>

        {/* Daily Metrics Overview - Removed Water/Steps Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-800 rounded-lg p-4 text-center">
            <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-300" />
            {/* Display total water from history, not current day input */}
            <div className="text-2xl font-bold">{totalWater.toFixed(1)}L</div>
            <div className="text-sm text-gray-300">Total Water</div>
          </div>
          <div className="bg-green-800 rounded-lg p-4 text-center">
            <Footprints className="w-8 h-8 mx-auto mb-2 text-green-300" />
            {/* Display total steps from history, not current day input */}
            <div className="text-2xl font-bold">{totalSteps.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Steps</div>
          </div>
          <div className="bg-purple-800 rounded-lg p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-300" />
            <div className="text-2xl font-bold">{completedDays.length}</div>
            <div className="text-sm text-gray-300">Days Complete</div>
          </div>
          <div className="bg-orange-800 rounded-lg p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-orange-300" />
            <div className="text-2xl font-bold">{75 - completedDays.length}</div>
            <div className="text-sm text-gray-300">Days Remaining</div>
          </div>
        </div>

        {/* Daily Non-Negotiables List */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Daily Non-Negotiables</h2>
          <div className="space-y-3">
            {nonNegotiables.map((task) => {
              const Icon = task.icon; // Dynamically get the icon component
              return (
                <div key={task.key} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                  <button
                    onClick={() => handleTaskToggle(task.key)}
                    className="flex-shrink-0"
                  >
                    {dailyTasks[task.key] ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span className={`flex-1 ${dailyTasks[task.key] ? 'line-through text-gray-400' : ''}`}>
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Water Intake and Steps Input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              Water Intake
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={waterIntake === 0 ? '' : waterIntake} // Display empty string if 0
                onChange={handleWaterChange}
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
                placeholder="Liters"
                step="0.1"
              />
              <span className="text-gray-400 flex items-center">L</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Footprints className="w-5 h-5 text-green-400" />
              Steps
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={steps === 0 ? '' : steps} // Display empty string if 0
                onChange={handleStepsChange}
                className="flex-1 bg-gray-700 rounded px-3 py-2 text-white"
                placeholder="Steps"
              />
              <span className="text-gray-400 flex items-center">steps</span>
            </div>
          </div>
        </div>


        {/* Journal Prompts Section */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowJournal(!showJournal)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
          >
            <BookOpen className="w-5 h-5 inline mr-2" />
            {showJournal ? 'Close Journal' : 'View Journal Prompts'}
          </button>
        </div>
        {showJournal && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setJournalMode('morning')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  journalMode === 'morning'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Sun className="w-4 h-4 inline mr-2" />
                Morning
              </button>
              <button
                onClick={() => setJournalMode('evening')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  journalMode === 'evening'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Moon className="w-4 h-4 inline mr-2" />
                Evening
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {journalMode === 'morning' ? 'Morning' : 'Evening'} Reflection Prompts
              </h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-300 mb-3">
                  {journalMode === 'morning' ? 'Morning Prompts' : 'Evening Prompts'}
                </h4>
                <ul className="space-y-2 text-gray-300">
                  {(journalMode === 'morning' ? morningPrompts : eveningPrompts).map((prompt, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-400 font-semibold">{index + 1}.</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-gray-600 rounded border-l-4 border-blue-400">
                  <p className="text-sm text-blue-200">
                    💡 Use these prompts in your physical journal for deeper reflection and growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Completion Button */}
        <div className="text-center mb-6">
          <button
            onClick={completeDay}
            disabled={!isDayComplete()} // Button is disabled until all tasks are complete
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
              isDayComplete()
                ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isDayComplete() ? 'Complete Day ' + currentDay : 'Complete All Tasks First'}
          </button>
        </div>

        {/* Reset Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <button
                onClick={resetDay}
                className="button-secondary bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
                Reset Daily Progress
            </button>
            <button
                onClick={resetChallenge}
                className="button-secondary bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
            >
                Reset Entire Challenge
            </button>
        </div>

        {/* Global Overview Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Challenge Overview
          </h2>

          {/* Challenge Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{completedDays.length}</div>
              <div className="text-sm text-green-100">Days Completed</div>
              <div className="text-xs text-green-200 mt-1">
                {Math.round((completedDays.length / 75) * 100)}% of challenge
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {/* Display total water from history */}
                {Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.waterIntake || 0), 0).toFixed(1)}L
              </div>
              <div className="text-sm text-blue-100">Total Water</div>
              <div className="text-xs text-blue-200 mt-1">
                Avg: {completedDays.length === 0 ? '0.0' : (Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.waterIntake || 0), 0) / completedDays.length).toFixed(1)}L per day
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {/* Display total steps from history */}
                {Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.steps || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-purple-100">Total Steps</div>
              <div className="text-xs text-purple-200 mt-1">
                Avg: {completedDays.length === 0 ? '0' : Math.round(Object.values(dailyHistory).reduce((total, dayData) => total + (dayData?.steps || 0), 0) / completedDays.length).toLocaleString()} per day
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {totalTasksCompleted}
              </div>
              <div className="text-sm text-orange-100">Tasks Completed</div>
              <div className="text-xs text-orange-200 mt-1">
                Out of {completedDays.length * nonNegotiables.length} total tasks
              </div>
            </div>
          </div>

          {/* Streak and Achievement Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-300 mb-3">🔥 Current Streak</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {(() => {
                    // Calculate current streak based on consecutive completed days
                    let streak = 0;
                    // Sort completed days in descending order to check from most recent
                    const sortedDays = [...completedDays].sort((a, b) => b - a);
                    if (sortedDays.length === 0) return 0;

                    // Check if yesterday was completed (currentDay - 1)
                    if (sortedDays[0] === currentDay - 1) {
                      streak = 1;
                      for (let i = 1; i < sortedDays.length; i++) {
                        if (sortedDays[i] === sortedDays[i-1] - 1) {
                          streak++;
                        } else {
                          break;
                        }
                      }
                    }
                    return streak;
                  })()}
                </div>
                <div className="text-sm text-gray-300">consecutive days</div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-300 mb-3">🏆 Achievements</h3>
              <div className="space-y-2 text-sm">
                {completedDays.length >= 7 && (
                  <div className="flex items-center gap-2 text-green-400">
                    <span>✓</span> First Week Warrior
                  </div>
                )}
                {completedDays.length >= 21 && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <span>✓</span> Habit Builder (21 days)
                  </div>
                )}
                {completedDays.length >= 50 && (
                  <div className="flex items-center gap-2 text-purple-400">
                    <span>✓</span> Marathon Mindset (50 days)
                  </div>
                )}
                {completedDays.length >= 75 && (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <span>✓</span> Hard 75 Champion!
                  </div>
                )}
                {completedDays.length < 7 && (
                  <div className="text-gray-400">Complete 7 days for your first achievement!</div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Breakdown / Day Grid */}
          {/* Shows a visual representation of completed/missed/current/future days */}
          <div className="mt-6">
            <h3 className="font-semibold text-blue-300 mb-3">📅 Challenge Days Overview</h3>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 xl:grid-cols-25 gap-2">
              {Array.from({ length: 75 }, (_, i) => i + 1).map(day => (
                <div
                  key={day}
                  className={`h-8 w-8 rounded flex items-center justify-center text-xs font-semibold ${
                    completedDays.includes(day)
                      ? 'bg-green-500 text-white' // Completed day
                      : day < currentDay && !completedDays.includes(day) // Missed day (past and not in completedDays)
                      ? 'bg-red-500 text-white'
                      : day === currentDay
                      ? 'bg-yellow-500 text-black' // Current day
                      : 'bg-gray-600 text-gray-400' // Future day
                  }`}
                  title={ // Tooltip for each day
                    completedDays.includes(day)
                      ? `Day ${day}: Completed`
                      : day < currentDay && !completedDays.includes(day)
                      ? `Day ${day}: Missed`
                      : day === currentDay
                      ? `Day ${day}: Today`
                      : `Day ${day}: Upcoming`
                  }
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Legend for the day grid */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 mt-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                Completed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                Today
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                Missed
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-600 rounded"></div>
                Future
              </span>
            </div>
          </div>
        </div>

        {/* Additional Guides Section */}
        <div className="space-y-6 mt-6">
          {/* Meal Planning Guide */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🍽️ Healthy Meal Planning Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold text-green-300 mb-3">Breakfast Ideas</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Overnight oats with berries</li>
                  <li>• Scrambled eggs with spinach</li>
                  <li>• Avocado toast on whole grain</li>
                  <li>• Greek yogurt with nuts</li>
                  <li>• Protein smoothie bowl</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-300 mb-3">Lunch Options</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Grilled chicken salad</li>
                  <li>• Quinoa bowl with vegetables</li>
                  <li>• Lentil soup with whole grain bread</li>
                  <li>• Turkey wrap with veggies</li>
                  <li>• Salmon with sweet potato</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-300 mb-3">Dinner Ideas</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Lean beef with broccoli</li>
                  <li>• Baked fish with vegetables</li>
                  <li>• Chicken stir-fry with brown rice</li>
                  <li>• Turkey meatballs with zucchini</li>
                  <li>• Grilled tofu with quinoa</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-orange-300 mb-3">Snacks</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Mixed nuts and seeds</li>
                  <li>• Apple with almond butter</li>
                  <li>• Cottage cheese with berries</li>
                  <li>• Hummus with vegetables</li>
                  <li>• Hard-boiled eggs</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <h5 className="font-semibold text-red-300 mb-2">Foods to Avoid</h5>
              <p className="text-gray-300 text-sm">
                Processed foods, refined sugars, white bread, pasta, fried foods, sugary drinks,
                alcohol, and fast food. Focus on whole, unprocessed foods.
              </p>
            </div>
          </div>

          {/* Sleep Hygiene Tips */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🌙 Sleep Hygiene Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-300 mb-3">Evening Routine</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• No screens after 7-8 PM</li>
                  <li>• Stop fluid intake by 7 PM</li>
                  <li>• Dim lights 1-2 hours before bed</li>
                  <li>• Keep bedroom cool (65-68°F)</li>
                  <li>• Use blackout curtains</li>
                  <li>• Practice relaxation techniques</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-300 mb-3">Sleep Environment</h4>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>• Comfortable mattress and pillows</li>
                  <li>• Keep room tidy and clutter-free</li>
                  <li>• Block out all light (blackout curtains)</li>
                  <li>• Minimize noise (earplugs if needed)</li>
                  <li>• Avoid working/eating in bed</li>
                  <li>• Establish a consistent sleep schedule</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hard75Tracker;
