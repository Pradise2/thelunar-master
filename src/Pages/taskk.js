import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import FormattedTime from '../Component/FormattedTime';
import './bg.css';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';

const Farm = () => {
  const [data, setData] = useState([]);
  const [farmData, setFarmData] = useState([]);
  const [homeData, setHomeData] = useState(null);
  const [username, setUserName] = useState(null);
  const [userId, setUserId] = useState("003");
  const [loading, setLoading] = useState(true);
  const [isFarming, setIsFarming] = useState(false);
  const [value, setValue] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);
  const [buttonText, setButtonText] = useState("Start");


  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/farm/${userId}`);
      setFarmData(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        createInitialUser();
      } else {
        console.error('Error fetching home data:', err);
        setError(`Failed to fetch data. Error: ${err.message}`);
        setLoading(false);
      }
    }
  };

  const createInitialUser = async () => {
    try {
      const res = await axios.post(`https://lunarapp.thelunarcoin.com/backend/api/farm/add`, { userId });
      console.log("Initial user created:", res.data);
      setFarmData(res.data);
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

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/home/${userId}`);
      setHomeData(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response && err.response.status === 404) {
      } else {
        console.error('Error fetching home data:', err);
        setError(`Failed to fetch data. Error: ${err.message}`);
        setLoading(false);
      }
    }
  };

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

    const initializeData = async () => {
      setLoading(true);
      try {
        const fetchedHomeData = await fetchHomeData();
        if (fetchedHomeData) {
          setHomeData(fetchedHomeData);
        }

        const fetchedData = await fetchData();
        if (fetchedData) {
          updateFarmTimeAndReward(fetchedData);
        } else {
          await createInitialUser(userId);
          const newData = await fetchData();
          updateFarmTimeAndReward(newData);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [userId]);

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
            setButtonText("Claim");
            return { ...user, farmTime: 0 };
          }
          return user;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [isFarming]);

  const updateUserInDatabase = async (user) => {
    try {
      await axios.post(`http://localhost:5000/farm/update/${user.userId}`, user);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const handleStart = () => {
    setIsFarming(true);
    setIsClaimable(false);
    setButtonText("Farming...");
  };

  const handleClaim = async (user) => {
    if (user.farmReward > 0) {
      const updatedUser = {
        ...user,
        farmTotal: user.farmTotal + user.farmReward, // Update farmTotal
        farmReward: 0, // Reset farmReward after claiming
        farmTime: 60, // Reset farmTime after claiming
        LastActiveFarmTime: Math.floor(Date.now() / 1000),
      };

      setValue(value + user.farmReward);
      setData((prevData) =>
        prevData.map((u) => (u.userId === user.userId ? updatedUser : u))
      );
      setIsClaimable(false);
      setButtonText("Start");
      await updateUserInDatabase(updatedUser);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-cover text-white p-4">
        <div className="flex flex-col items-center space-y-4">
          <ClipLoader color="#FFD700" size={60} speedMultiplier={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover text-white flex flex-col items-center p-4 space-y-3">
      <h1 className="text-4xl font-normal">Farm LAR tokens</h1>
      <p className="text-4xl font-normal text-golden-moon">
          {data[0]?.farmTotal.toFixed(1)}
        </p>
      <p className="text-zinc-400 text-center">
        Propel yourself by farming LAR!<br />
        Claim more LAR and reach for the stars!
      </p>
      <div className="bg-zinc-800 bg-opacity-70 text-red-700 w-full max-w-md px-4 py-2 rounded-xl text-center">
        Current farming era: <span className="text-yellow-900">⏰</span> <FormattedTime time={data[0]?.farmTime} />
      </div>
      <div className="bg-zinc-800 bg-opacity-70 text-card-foreground p-2 rounded-3xl w-full max-w-md text-center min-h-[40vh] flex flex-col justify-center space-y-5">
      
        <p className="text-zinc-400 text-muted-foreground">Farming era reward</p>
        <p className="text-4xl font-normal text-primary">
          {data[0]?.farmReward.toFixed(1)} <span className="text-golden-moon">LAR</span>
        </p>
      </div>
      <div className="space-y-6 w-full flex items-center flex-col">
        <button
          onClick={() => (isClaimable ? handleClaim(data[0]) : handleStart())}
          className={`text-white hover:bg-secondary/80 px-6 py-3 rounded-xl w-full max-w-md ${buttonText === "Farming..." ? "bg-zinc-800 bg-opacity-70" : "bg-gradient-to-r from-golden-moon"}`}
        >
          {buttonText}
        </button>
      </div>
      <div className="w-full max-w-md bg-zinc-900 fixed bottom-0 left-0 flex justify-around py-1">
        <Footer />
        </div>
    </div>
    
  );
};

export default Farm;
