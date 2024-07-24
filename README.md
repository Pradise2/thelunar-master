import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Farm = () => {
  const [data, setData] = useState([]);
  const [homeData, setHomeData] = useState({ homeBalance: 0 }); // Default home balance
  const [userId, setUserId] = useState("40017");
  const [loading, setLoading] = useState(true);
  const [isFarming, setIsFarming] = useState(false);
  const [value, setValue] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);

  useEffect(() => {
    const fetchHomeData = async (id) => {
      try {
        const res = await axios.get(`http://localhost:5000/home/${id}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching home data:', err);
        return null;
      }
    };

    const fetchData = async (id) => {
      try {
        const res = await axios.get(`http://localhost:5000/farm/${id}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching farm data:', err);
        return null;
      }
    };

    const createInitialUser = async (id) => {
      try {
        const res = await axios.post(`http://localhost:5000/farm/add`, {
          userId: id.toString(),
        });
        console.log("Initial user created:", res.data);
        return res.data;
      } catch (err) {
        console.error('Error creating initial user:', err);
        return null;
      }
    };

    const initializeData = async () => {
      setLoading(true); // Set loading to true before fetching data
      try {
        // Fetch home data first
        const fetchedHomeData = await fetchHomeData(userId);
        if (fetchedHomeData) {
          setHomeData(fetchedHomeData);
        } else {
          console.error('Failed to fetch home data for user:', userId);
        }

        // Fetch farm data
        const fetchedData = await fetchData(userId);
        if (fetchedData) {
          updateFarmTimeAndReward(fetchedData);
        } else {
          await createInitialUser(userId);
          const newData = await fetchData(userId);
          updateFarmTimeAndReward(newData);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false); // Set loading to false when done
      }
    };

    initializeData();
  }, [userId]);

  const updateFarmTimeAndReward = (data) => {
    const now = Math.floor(Date.now() / 1000);
    const updatedData = data.map((user) => {
      const elapsed = now - user.LastActiveFarmTime;
      if (user.farmTime > 0) {
        const timeSpent = Math.min(elapsed, user.farmTime);
        user.farmTime = Math.max(user.farmTime - elapsed, 0);
        user.farmReward += timeSpent * 0.1;
      }
      user.LastActiveFarmTime = now;
      return user;
    });
    setData(updatedData);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setData((prevData) =>
        prevData.map((user) => {
          if (user.farmTime > 0 && isFarming) {
            const updatedUser = {
              ...user,
              farmTime: user.farmTime - 1,
              farmReward: user.farmReward + 0.1,
            };
            updateUserInDatabase(updatedUser);
            return updatedUser;
          } else if (user.farmTime <= 0 && isFarming) {
            setIsFarming(false);
            setIsClaimable(true);
            return { ...user, farmTime: 0 };
          }
          return user;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [data, isFarming]);

  const updateUserInDatabase = async (user) => {
    try {
      await axios.post(`http://localhost:5000/farm/update/${user.userId}`, user);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const updateUserHomeInDatabase = async (user) => {
    try {
      await axios.post(`http://localhost:5000/home/update/${user.userId}`, user);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const resetTap = (user) => {
    const updatedUser = {
      ...user,
      farmTime: 60, // Reset to 60 seconds
      farmReward: 0,
      LastActiveFarmTime: Math.floor(Date.now() / 1000),
    };

    updateUserInDatabase(updatedUser);
    return updatedUser;
  };

  const handleStart = () => {
    setIsFarming(true);
    setIsClaimable(false);
  };

  const handleClaim = (user) => {
    const updatedUserHome = {
      ...homeData,
      homeBalance: (homeData.homeBalance || 0) + user.farmReward,
    };

    setValue(value + user.farmReward);
    setData((prevData) =>
      prevData.map((u) => (u.userId === user.userId ? resetTap(u) : u))
    );
    setIsClaimable(false);

    setHomeData(updatedUserHome); // Update homeData with the new balance
    updateUserHomeInDatabase(updatedUserHome);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.map((user) => (
        <div key={user.userId}>
          <h3>User: {user.userId}</h3>
          <p>Farm Time: {user.farmTime}</p>
          <p>Farm Reward: {user.farmReward.toFixed(1)}</p>
          <p>Last Active Farm Time: {user.LastActiveFarmTime}</p>
          <p>Home Balance: {homeData?.homeBalance?.toFixed(1)}</p> {/* Display home balance */}
          {isClaimable ? (
            <button onClick={() => handleClaim(user)}>Claim</button>
          ) : isFarming ? (
            <p>Farming...</p>
          ) : (
            <button onClick={handleStart}>Start</button>
          )}
        </div>
      ))}
      <p>Total Value: {value.toFixed(1)}</p>
    </div>
  );
};

export default Farm;




 (
                <ul>
                    {taskData.map(task => (
                        <li key={task._id}>
                            <p>Username: {task.username}</p>
                            <p>Tasks Complete:</p>
                            <ul>
                                {task.tasksComplete.map((status, index) => (
                                    <li key={index} onClick={() => handleTaskClick(index, task._id)}>
                                        {index}: {status}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
