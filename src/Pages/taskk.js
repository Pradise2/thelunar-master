import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import './Spinner.css';
import { ClipLoader } from 'react-spinners';
import { addUserTasks, getUserTasks, updateHomeBalance, getUserFromHome } from '../utils/firestoreFunctions';
import './bg.css';
import RCTasks from '../Component/RCTasks';
import { motion, AnimatePresence } from 'framer-motion';
import logo from './logo.png'

const Tasks = () => {
  const [userData, setUserData] = useState(null);
  const [userId, setUserId] = useState("743737380"); // Replace with dynamic ID if possible
  const [taskFilter, setTaskFilter] = useState('new');
  const [loadingTask, setLoadingTask] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [taskReadyToClaim, setTaskReadyToClaim] = useState(null);
  const [showRCTasks, setShowRCTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // New state for selected task
  const [showGoButton, setShowGoButton] = useState(false); // New state for showing "Go" button
  const [loading, setLoading] = useState(true); // New state for loading

  const tasks = [
    { id: 1, title: 'Invite 5 Friends', reward: 15000, link: "https://youtube.com" },
    { id: 2, title: 'Complete Profile', reward: 5000, link: "https://example.com" },
    { id: 3, title: 'Join Community', reward: 10000, link: "https://example.com" },
  ];

  window.Telegram.WebApp.expand();

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
      } else {
        console.error('User data is not available.');
      }
    } else {
      console.error('Telegram WebApp script is not loaded.');
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserTasks(userId);
        if (data) {
          setUserData(data);
          if (data.taskFilter) {
            setTaskFilter(data.taskFilter);
          }
        } else {
          const initialData = {
            TasksComplete: {},
            TasksStatus: {},
          };
          tasks.forEach(task => {
            initialData.TasksComplete[task.id] = false; // Set each task's TasksComplete to false initially
            initialData.TasksStatus[task.id] = 'start'; // Set each task's TasksStatus to 'start' initially
          });
          await addUserTasks(userId, initialData);
          setUserData(initialData);
        }
        setLoading(false); // Data fetching completed
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false); // Data fetching completed even if there is an error
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const fetchHomeData = async () => {
      const data = await getUserFromHome(userId);
      setHomeData(data);
    };

    fetchHomeData();
  }, [userId]);

  useEffect(() => {
    const saveUserData = async () => {
      if (userId && userData) {
        try {
          await addUserTasks(userId, userData);
        } catch (error) {
          console.error('Error saving data:', error);
        }
      }
    };

    const handleBeforeUnload = (e) => {
      saveUserData();
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    const saveInterval = setInterval(saveUserData, 10000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(saveInterval);
      saveUserData();
    };
  }, [userId, userData]);

  const handleClaimClick = async (taskId, reward) => {
    const task = tasks.find(t => t.id === taskId);

    // Vibrate when claiming
    if (navigator.vibrate) {
      navigator.vibrate(500); // Vibrate for 500ms
    }

    // Update TasksComplete to true for the clicked task
    setUserData(prevData => ({
      ...prevData,
      TasksComplete: {
        ...prevData.TasksComplete,
        [taskId]: true,
      },
      TasksStatus: {
        ...prevData.TasksStatus,
        [taskId]: 'completed',
      }
    }));

    // Update HomeBalance with the reward
    try {
      const updatedHomeData = await getUserFromHome(userId); // Fetch latest home data to ensure up-to-date balance
      const newHomeBalance = updatedHomeData.HomeBalance + reward;
      await updateHomeBalance(userId, newHomeBalance);
      setHomeData(prevData => ({
        ...prevData,
        HomeBalance: newHomeBalance,
      }));
      setSelectedTask(task); // Set the selected task
      setShowRCTasks(true);

      // Show "Go" button after claim is clicked
      setShowGoButton(true);

      // Hide RewardCard after 2 seconds
      setTimeout(() => setShowRCTasks(false), 2000);

      console.log(`HomeBalance updated with ${reward} LAR`);
    } catch (error) {
      console.error('Error updating HomeBalance:', error);
    }
  };

  const handleStartClick = (taskId, link) => {
    setLoadingTask(taskId);

    // Open the link in a new tab
    window.open(link, '_blank');

    // Simulate loading delay
    setTimeout(() => {
      setLoadingTask(null);
      setTaskReadyToClaim(taskId);
      setUserData(prevData => ({
        ...prevData,
        TasksStatus: {
          ...prevData.TasksStatus,
          [taskId]: 'claim',
        }
      }));
    }, 5000); // Simulate loading time, change as needed
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'new') {
      return userData && userData.TasksStatus[task.id] !== 'completed';
    } else if (taskFilter === 'completed') {
      return userData && userData.TasksStatus[task.id] === 'completed';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-cover text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-white text-4xl font-normal">
            <ClipLoader
              color="#FFD700" // Golden color
              size={60}
              speedMultiplier={1}
            />
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cover min-h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto bg-cover text-center text-white p-4">
        <h1 className="text-2xl font-bold">Complete the mission,<br /> earn the commission!</h1>
        <p className="text-zinc-500 mt-2">But hey, only qualified actions unlock the <br /> LAR galaxy! ✨</p>
        <div className="flex justify-center w-full mt-4">
          <button 
            className={`py-2 bg-opacity-70 text-center text-sm w-full rounded-2xl ${taskFilter === 'new' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
            onClick={() => setTaskFilter('new')}
          > 
            New
          </button>
          <button 
            className={`bg-opacity-70 py-2 text-center text-sm w-full rounded-2xl ${taskFilter === 'completed' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}
            onClick={() => setTaskFilter('completed')}
          >
            Completed
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {filteredTasks.length === 0 && taskFilter === 'completed' && (
            <div>No completed tasks yet.</div>
          )}
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-zinc-800 bg-opacity-70 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-golden-moon flex">            
                  <img aria-hidden="true" alt="team-icon" src={logo} className="mr-2" width='25' height='5'/>
                {task.reward.toLocaleString()} LAR</p>
              </div>
              <div className="flex items-center space-x-2">
                {userData.TasksStatus[task.id] === 'start' && (
                  <button 
                    onClick={() => handleStartClick(task.id, task.link)} 
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                    disabled={loadingTask === task.id}
                  >
                    {loadingTask === task.id ? (
                      <div className="spinner-border spinner-border-sm"></div>
                    ) : (
                      'Start'
                    )}
                    </button>
                  )}
                  {userData.TasksStatus[task.id] === 'claim' && (
                    <button 
                      onClick={() => handleClaimClick(task.id, task.reward)} 
                      className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                    >
                      Claim
                    </button>
                  )}
                  {userData.TasksStatus[task.id] === 'completed' && (
                    <button 
                      className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                      disabled
                    >
                      Completed
                    </button>
                  )}
                  {showGoButton && userData.TasksStatus[task.id] === 'completed' && (
                    <a href={task.link} target="_blank" rel="noopener noreferrer" className="bg-primary text-primary-foreground py-2 px-4 text-golden-moon rounded-lg">
                      Go
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
  
        <AnimatePresence>
          {showRCTasks && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
              onClick={() => setShowRCTasks(false)} // Click anywhere to close RewardCard
            >
              <RCTasks onClose={() => setShowRCTasks(false)} task={selectedTask} />
            </motion.div>
          )}
        </AnimatePresence>
  
        <div className="w-full max-w-md sticky bottom-0 left-0 flex text-white bg-zinc-900 justify-around py-1">
          <Footer />
        </div>
      </div>
    );
  };
  
  export default Tasks;
  