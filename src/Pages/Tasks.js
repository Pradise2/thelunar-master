import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import './Spinner.css';
import { ClipLoader } from 'react-spinners';
import './bg.css';
import RCTasks from '../Component/RCTasks';
import { motion, AnimatePresence } from 'framer-motion';
import logo from './logo.png';
import axios from 'axios';

const TaskComponent = () => {
  const [userId, setUserId] = useState("743737380");
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [buttonLoading, setButtonLoading] = useState({});
  const [taskFilter, setTaskFilter] = useState('new');
  const [loadingTask, setLoadingTask] = useState(null);


  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const { WebApp } = window.Telegram;
      
      // Expand the WebApp
      WebApp.expand();
  
      const user = WebApp.initData?.user;
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
    fetchData();
    addTask({
      name: "Retweet, comment and like twee", 
      status: "start",
      reward: "1000", 
      linkz: "https://x.com/TheLunar_Coin/status/1815147922029199429?t=-waUnThgS_cwOvMibbqhsg&s=19"

  });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/task/${userId}`);
      setTaskData(response.data);
    } catch (err) {
      console.error('Error fetching task data:', err);
      setError(`Failed to fetch data. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async (taskId, action) => {
    setButtonLoading(prevState => ({ ...prevState, [taskId]: true }));

    if (action === 'start') {
      const task = taskData.find(task => task.taskId === taskId);
      const linkz = task.linkz.startsWith('http') ? task.linkz : `https://${task.linkz}`;
      window.open(linkz, '_blank');

      setTimeout(async () => {
        try {
          await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/task/update`, {
            userId: userId,
            taskId: taskId,
            status: 'claim'
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          setTaskData(prevState =>
            prevState.map(task =>
              task.taskId === taskId ? { ...task, status: 'claim' } : task
            )
          );
        } catch (err) {
          console.error('Error updating task status:', err.response ? err.response.data : err.message);
          setError(`Failed to update task. Error: ${err.response ? err.response.data.message : err.message}`);
        } finally {
          setButtonLoading(prevState => ({ ...prevState, [taskId]: false }));
        }
      }, 5000);
    } else if (action === 'claim') {
      try {
        await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/task/updateStatus`, {
          userId: userId,
          taskId: taskId,
          status: 'complete'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setTaskData(prevState =>
          prevState.map(task =>
            task.taskId === taskId ? { ...task, status: 'complete' } : task
          )
        );
      } catch (err) {
        console.error('Error updating task status:', err.response ? err.response.data : err.message);
        setError(`Failed to update task. Error: ${err.response ? err.response.data.message : err.message}`);
      } finally {
        setButtonLoading(prevState => ({ ...prevState, [taskId]: false }));
      }
    }
  };

  const addTask = async (newTask) => {
    try {
      const addResponse = await axios.post('https://lunarapp.thelunarcoin.com/backend/api/task/add', newTask, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log('Add task response:', addResponse.data);
  
      fetchData(); // Assuming fetchData() refreshes the task list or updates the UI
    } catch (err) {
      console.error('Error adding task:', err.response ? err.response.data : err.message);
      setError(`Failed to add task. Error: ${err.response ? err.response.data.message : err.message}`);
    }
  };
  

  const filteredTasks = taskData.filter(task => {
    if (taskFilter === 'new') {
      return task.status !== 'complete';
    } else if (taskFilter === 'completed') {
      return task.status === 'complete';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-cover text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-white text-4xl font-normal">
            <ClipLoader color="#FFD700" size={60} speedMultiplier={1} />
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
          {filteredTasks.length === 0 && taskFilter === 'new' && (
            <div>No new tasks yet.</div>
          )}
          
          {filteredTasks.map((task) => (
            <div key={task.taskId} className="bg-zinc-800 bg-opacity-70 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-semibold">{task.name}</p>
                <p className="text-golden-moon flex">
                  <img aria-hidden="true" alt="team-icon" src={logo} className="mr-2" width='25' height='5' />
                  {task.reward} LAR
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {task.status === 'start' && (
                  <button
                    onClick={() => handleButtonClick(task.taskId, 'start')}
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                    disabled={loadingTask === task.taskId}
                  >
                    {loadingTask === task.taskId ? (
                      <div className="spinner-border spinner-border-sm"></div>
                    ) : (
                      'Start'
                    )}
                  </button>
                )}
                {task.status === 'claim' && (
                  <button
                    onClick={() => handleButtonClick(task.taskId, 'claim')}
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl" 
                    disabled={loadingTask === task.taskId}
                  >
                    {loadingTask === task.taskId ? <div className="spinner-border spinner-border-sm"></div> : 'Claim'}
                  </button>
                )}
                {task.status === 'complete' && (
                  <button 
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                    disabled
                  >
                    Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full max-w-md sticky bottom-0 left-0 flex text-white bg-zinc-900 justify-around py-1">
        <Footer />
      </div>
    </div>
  );
};

export default TaskComponent;
