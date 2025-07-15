import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Droplets, Target, BookOpen, Footprints, Moon, Sun, CheckCircle2, Circle, TrendingUp, User, LogOut, UserPlus, LogIn } from 'lucide-react';

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
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Stores the username of the logged-in user
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });

  // In-memory user data storage (mock database)
  // This object holds all user data, including their daily progress and history
  const [users, setUsers] = useState({
    demo1: {
      email: 'demo1@example.com',
      password: 'demo123',
      currentDay: 1,
      dailyTasks: { ...defaultDailyTasks }, // Use default tasks
      waterIntake: 0,
      steps: 0,
      completedDays: [],
      dailyHistory: {} // Stores historical data for each completed day
    },
    demo2: {
      email: 'demo2@example.com',
      password: 'demo123',
      currentDay: 3,
      dailyTasks: { ...defaultDailyTasks }, // Use default tasks
      waterIntake: 1.2,
      steps: 5000,
      completedDays: [1, 2],
      dailyHistory: { // Example history for demo2
        1: { dailyTasks: { ...defaultDailyTasks, wakeUp4am: true, morningJournal: true, exercise5am: true, water1L: true, noCoffeePhone: true, threeMeals: true, water2to3L: true, walk8k: true, eveningJournal: true, noPhoneAfter8: true }, waterIntake: 2.5, steps: 10000, date: '2024-07-01T12:00:00.000Z' },
        2: { dailyTasks: { ...defaultDailyTasks, wakeUp4am: true, morningJournal: true, exercise5am: true, water1L: true, noCoffeePhone: true, threeMeals: true, water2to3L: true, walk8k: true, eveningJournal: true, noPhoneAfter8: true }, waterIntake: 3.0, steps: 12000, date: '2024-07-02T12:00:00.000Z' }
      }
    }
  });

  // User-specific progress states (loaded from `users` object)
  const [currentDay, setCurrentDay] = useState(1);
  const [dailyTasks, setDailyTasks] = useState({ ...defaultDailyTasks });
  const [waterIntake, setWaterIntake] = useState(0);
  const [steps, setSteps] = useState(0);
  const [completedDays, setCompletedDays] = useState([]); // Array of completed day numbers

  // UI states
  const [showJournal, setShowJournal] = useState(false);
  const [journalMode, setJournalMode] = useState('morning'); // 'morning' or 'evening'
  const [message, setMessage] = useState(null); // For displaying user messages (e.g., errors, success)
  const [messageType, setMessageType] = useState(null); // 'success' or 'error'

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

  // Effect to load user data when currentUser or users object changes (on sign-in or when users data is updated)
  useEffect(() => {
    if (currentUser && users[currentUser]) {
      const userData = users[currentUser];
      setCurrentDay(userData.currentDay || 1);
      setDailyTasks(userData.dailyTasks || { ...defaultDailyTasks });
      setWaterIntake(userData.waterIntake || 0);
      setSteps(userData.steps || 0);
      setCompletedDays(userData.completedDays || []);
    }
  }, [currentUser, users]); // Depend on users to reload component states if the global users object changes

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
  const handleSignUp = () => {
    if (!authForm.username || !authForm.password || !authForm.email) {
      showMessage('Please fill in all fields!', 'error');
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      showMessage('Passwords do not match!', 'error');
      return;
    }
    if (users[authForm.username]) {
      showMessage('Username already exists!', 'error');
      return;
    }

    const newUser = {
      email: authForm.email,
      password: authForm.password,
      currentDay: 1,
      dailyTasks: { ...defaultDailyTasks },
      waterIntake: 0,
      steps: 0,
      completedDays: [],
      dailyHistory: {}
    };

    setUsers(prev => ({
      ...prev,
      [authForm.username]: newUser
    }));

    setCurrentUser(authForm.username);
    setIsAuthenticated(true);
    setAuthForm({ username: '', password: '', confirmPassword: '', email: '' });
    showMessage('Account created successfully!', 'success');
  };

  // Handles user sign-in
  const handleSignIn = () => {
    if (!authForm.username || !authForm.password) {
      showMessage('Please enter username and password!', 'error');
      return;
    }

    if (users[authForm.username] && users[authForm.username].password === authForm.password) {
      setCurrentUser(authForm.username);
      setIsAuthenticated(true);
      setAuthForm({ username: '', password: '', confirmPassword: '', email: '' });
      showMessage('Signed in successfully!', 'success');
    } else {
      showMessage('Invalid username or password!', 'error');
    }
  };

  // Handles user sign-out
  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    // Reset local states to default when signing out
    setCurrentDay(1);
    setDailyTasks({ ...defaultDailyTasks });
    setWaterIntake(0);
    setSteps(0);
    setCompletedDays([]);
    showMessage('Signed out successfully!', 'success');
  };

  // Toggles the completion status of a daily task and updates the global users state
  const handleTaskToggle = (taskKey) => {
    setDailyTasks(prev => {
      const newDailyTasks = { ...prev, [taskKey]: !prev[taskKey] };
      // Update the users state immediately
      if (currentUser) {
        setUsers(prevUsers => ({
          ...prevUsers,
          [currentUser]: {
            ...prevUsers[currentUser],
            dailyTasks: newDailyTasks
          }
        }));
      }
      return newDailyTasks; // Return the new state for local update
    });
  };

  // Calculates the percentage of daily tasks completed
  const getCompletionPercentage = () => {
    const totalTasks = Object.values(dailyTasks).length;
    const completedTasks = Object.values(dailyTasks).filter(Boolean).length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  // Checks if all daily tasks are completed
  const isDayComplete = () => {
    return Object.values(dailyTasks).every(value => value);
  };

  // Resets all daily tasks, water intake, and steps for the current day, and updates users state
  const resetDay = () => {
    setDailyTasks({ ...defaultDailyTasks });
    setWaterIntake(0);
    setSteps(0);

    // Update the users state directly here
    if (currentUser) {
      setUsers(prevUsers => ({
        ...prevUsers,
        [currentUser]: {
          ...prevUsers[currentUser],
          dailyTasks: { ...defaultDailyTasks },
          waterIntake: 0,
          steps: 0
        }
      }));
    }
    showMessage('Daily progress reset!', 'success');
  };

  // Marks the current day as complete and advances to the next day, updating all relevant states
  const completeDay = () => {
    if (isDayComplete()) {
      const newCompletedDays = [...completedDays, currentDay];
      const nextDay = currentDay < 75 ? currentDay + 1 : currentDay;

      // Prepare the daily history entry for the day just completed
      const newDailyHistoryEntry = {
        dailyTasks: { ...dailyTasks }, // Deep copy current daily tasks
        waterIntake,
        steps,
        date: new Date().toISOString()
      };

      // Update the users state for the completed day's history and the next day's currentDay/completedDays
      setUsers(prevUsers => ({
        ...prevUsers,
        [currentUser]: {
          ...prevUsers[currentUser],
          currentDay: nextDay, // Advance currentDay in users object
          completedDays: newCompletedDays, // Add to completedDays in users object
          dailyHistory: {
            ...(prevUsers[currentUser]?.dailyHistory || {}),
            [currentDay]: newDailyHistoryEntry // Add history for the just completed day
          }
        }
      }));

      // Update local states for immediate UI reflection
      setCompletedDays(newCompletedDays);
      if (currentDay < 75) {
        setCurrentDay(nextDay);
      }

      // Reset the current day's tasks and metrics.
      // This call to resetDay will also update the 'users' object for dailyTasks, waterIntake, steps.
      resetDay();

      showMessage(`Day ${currentDay} completed! ${currentDay < 75 ? `Moving to Day ${nextDay}.` : 'Challenge finished!'}`, 'success');
    } else {
      showMessage('Please complete all tasks before completing the day!', 'error');
    }
  };

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
              {authMode === 'signup' && (
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
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-semibold text-yellow-300 mb-2">Demo Users</h4>
              <p className="text-sm text-gray-300 mb-2">Try these demo accounts:</p>
              <div className="text-xs text-gray-400">
                <div>Username: demo1 | Password: demo123</div>
                <div>Username: demo2 | Password: demo123</div>
              </div>
            </div>
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
                <span className="font-semibold">{currentUser}</span>
              </div>
              <div className="text-sm text-gray-400">
                {users[currentUser]?.email || 'No email'}
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

        {/* Daily Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-800 rounded-lg p-4 text-center">
            <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-300" />
            <div className="text-2xl font-bold">{waterIntake}L</div>
            <div className="text-sm text-gray-300">Water Today</div>
          </div>
          <div className="bg-green-800 rounded-lg p-4 text-center">
            <Footprints className="w-8 h-8 mx-auto mb-2 text-green-300" />
            <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Steps Today</div>
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

        {/* Water Intake and Steps Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              Water Intake
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={waterIntake}
                onChange={(e) => {
                  const newWaterIntake = parseFloat(e.target.value) || 0;
                  setWaterIntake(newWaterIntake);
                  if (currentUser) {
                    setUsers(prevUsers => ({
                      ...prevUsers,
                      [currentUser]: {
                        ...prevUsers[currentUser],
                        waterIntake: newWaterIntake
                      }
                    }));
                  }
                }}
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
                value={steps}
                onChange={(e) => {
                  const newSteps = parseInt(e.target.value) || 0;
                  setSteps(newSteps);
                  if (currentUser) {
                    setUsers(prevUsers => ({
                      ...prevUsers,
                      [currentUser]: {
                        ...prevUsers[currentUser],
                        steps: newSteps
                      }
                    }));
                  }
                }}
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
                {(() => {
                  const totalWater = users[currentUser]?.completedDays?.reduce((total, day) => {
                    const dayData = users[currentUser]?.dailyHistory?.[day];
                    return total + (dayData?.waterIntake || 0);
                  }, 0) || 0;
                  return totalWater.toFixed(1);
                })()}L
              </div>
              <div className="text-sm text-blue-100">Total Water</div>
              <div className="text-xs text-blue-200 mt-1">
                Avg: {(() => {
                  if (completedDays.length === 0) return '0.0';
                  const totalWater = users[currentUser]?.completedDays?.reduce((total, day) => {
                    const dayData = users[currentUser]?.dailyHistory?.[day];
                    return total + (dayData?.waterIntake || 0);
                  }, 0) || 0;
                  return (totalWater / completedDays.length).toFixed(1);
                })()}L per day
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {(() => {
                  const totalSteps = users[currentUser]?.completedDays?.reduce((total, day) => {
                    const dayData = users[currentUser]?.dailyHistory?.[day];
                    return total + (dayData?.steps || 0);
                  }, 0) || 0;
                  return totalSteps.toLocaleString();
                })()}
              </div>
              <div className="text-sm text-purple-100">Total Steps</div>
              <div className="text-xs text-purple-200 mt-1">
                Avg: {(() => {
                  if (completedDays.length === 0) return '0';
                  const totalSteps = users[currentUser]?.completedDays?.reduce((total, day) => {
                    const dayData = users[currentUser]?.dailyHistory?.[day];
                    return total + (dayData?.steps || 0);
                  }, 0) || 0;
                  return Math.round(totalSteps / completedDays.length).toLocaleString();
                })()} per day
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">
                {(() => {
                  const totalTasks = users[currentUser]?.completedDays?.reduce((total, day) => {
                    const dayData = users[currentUser]?.dailyHistory?.[day];
                    if (!dayData?.dailyTasks) return total;
                    const completed = Object.values(dayData.dailyTasks).filter(Boolean).length;
                    return total + completed;
                  }, 0) || 0;
                  return totalTasks;
                })()}
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
