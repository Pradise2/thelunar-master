import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskComponent = () => {
  const [userId, setUserId] = useState("020");
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/task/${userId}`);
      setTaskData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        await createInitialUser();
      } else {
        console.error('Error fetching task data:', err);
        setError(`Failed to fetch data. Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createInitialUser = async () => {
    try {
      const response = await axios.post(`https://lunarapp.thelunarcoin.com/backend/api/task/add`, { userId });
      console.log("Initial user created:", response.data);
      setTaskData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        fetchData();
      } else {
        console.error('Error creating initial user:', err);
        setError(`Failed to create initial user. Error: ${err.message}`);
        setLoading(false);
      }
    }
  };

  return (
    <div>
      
        <div>
          <h1>Task Data</h1>
          
        </div>
      )}
    </div>
  );
};

export default TaskComponent;
