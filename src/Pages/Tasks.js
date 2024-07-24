import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import './Spinner.css';
import { ClipLoader } from 'react-spinners';
import './bg.css';
import RCTasks from '../Component/RCTasks';
import { motion, AnimatePresence } from 'framer-motion';
import logo from './logo.png';
import axios from 'axios';

const Dashboard = () => {
  const [userId, setUserId] = useState("008"); // Replace with your actual userId or retrieve dynamically
  const [taskFilter, setTaskFilter] = useState('new');
  const [homeData, setHomeData] = useState([]);
  const [taskData, setTaskData] = useState({ tasks: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingTask, setLoadingTask] = useState(null);

  // Function to add tasks
  const addTasks = async () => {
    try {
        const tasks = [
            { id: 1, name: "Start", status: "start", reward: 15000, link: "https://youtube.com" }                                                
          ];
      const response = await axios.post(`http://localhost:5000/task/addTasks`, {
        userId,
        tasks
      });

      console.log('Tasks added successfully:', response.data);
      setTaskData(response.data);
    } catch (error) {
      console.error('Error adding tasks:', error);
      setError('Error adding tasks');
    }
  };

  // Function to fetch home data
  const fetchHomeData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/home/${userId}`);
      setHomeData(response.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Error fetching home data');
    }
  };

  // Function to fetch task data
  const fetchTaskData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/task/${userId}`);
      setTaskData(response.data);
    } catch (error) {
      console.error('Error fetching task data:', error);
      setError('Error fetching task data');
      await createInitialUser();
      await fetchTaskData();
    }
  };

  // Function to create initial user
  const createInitialUser = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/task/add`, {
        userId,
        username: 'test',
        tasks: []
      });
      console.log("Initial user created:", response.data);
      return response.data;
    } catch (err) {
      console.error('Error creating initial user:', err);
      setError('Error creating initial user');
      return null;
    }
  };
  

  const updateTaskStatus = async (taskId) => {
    try {
      setLoadingTask(taskId); // Set the loading task ID

      // Find the task to get the link
      const task = taskData.tasks.find(task => task._id === taskId);

      if (!task) {
        throw new Error('Task not found in state');
      }

      // Open the link if available
      if (task.link) {
        window.open(task.link, "_blank");
      } else {
        console.warn('No link available for this task');
      }

      // Simulate a delay of 6 seconds
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Update the task status
      const response = await axios.post(`http://localhost:5000/task/updateStatus`, {
        userId,
        taskId
      });

      console.log('Task status updated successfully:', response.data);

      // Update task data in the state
      setTaskData(prevData => {
        const updatedTasks = prevData.tasks.map(t =>
          t._id === taskId ? response.data.task : t
        );
        return { tasks: updatedTasks };
      });

    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Error updating task status');
    } finally {
      setLoadingTask(null); // Clear the loading task ID
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchHomeData();
      await fetchTaskData();
      await addTasks(); // Automatically add tasks after fetching data
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const filteredTasks = taskData.tasks.filter(task => {
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
                <p className="font-semibold">{task.name}</p>
                <p className="text-golden-moon flex">            
                  <img aria-hidden="true" alt="team-icon" src={logo} className="mr-2" width='25' height='5'/>
                  {task.reward.toLocaleString()} LAR
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {task.status === 'start' && (
                  <button 
                    onClick={() => updateTaskStatus(task._id)} 
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                    disabled={loadingTask === task._id} // Disable the button while loading
                  >
                    {loadingTask === task._id ? (
                      <div className="spinner-border spinner-border-sm"></div>
                    ) : (
                      'Start'
                    )}
                  </button>
                )}
                {task.status === 'claim' && (
                  <button 
                    onClick={() => updateTaskStatus(task._id)} 
                    className="bg-golden-moon text-white py-2 px-4 rounded-xl"
                  >
                    Claim
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

export default Dashboard;
