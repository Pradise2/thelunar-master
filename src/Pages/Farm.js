import React, { useState, useEffect, useRef } from 'react';
import Footer from '../Component/Footer';
import FormattedTime from '../Component/FormattedTime';
import './bg.css';
import { ClipLoader } from 'react-spinners';
import axios from 'axios';

const Farm = () => {
  const [farmData, setFarmData] = useState({
    farmTime: 21600,
    lastActiveTime: Math.floor(Date.now() / 1000),
    farmReward: 0,
  });
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFarming, setIsFarming] = useState(false);
  const [isClaimable, setIsClaimable] = useState(false);
  const [buttonText, setButtonText] = useState("Start");
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const { WebApp } = window.Telegram;
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/farm/${userId}`);
      console.log('Fetch Data Response:', response.data); // Debugging log
      const now = Math.floor(Date.now() / 1000);

      const lastActiveFarmTime = parseInt(response.data.lastActiveFarmTime, 10) || now;
      let remainingFarmTime = parseInt(response.data.farmTime, 10) || 21600;
      let farmReward = parseFloat(response.data.farmReward) || 0.0;

      if (response.data.farmStatus === 'farming') {
        const elapsed = now - lastActiveFarmTime;
        remainingFarmTime = Math.max(0, remainingFarmTime - elapsed);
        farmReward += parseFloat((elapsed * 0.01).toFixed(2)); // Assuming reward calculation logic
        if (remainingFarmTime === 0) {
          setIsFarming(false);
          setIsClaimable(true);
          setButtonText("Claim");
        } else {
          setIsFarming(true);
          setButtonText("Farming...");
        }
      }

      setFarmData({
        ...response.data,
        farmTime: remainingFarmTime,
        farmReward: farmReward.toFixed(2),
      });

      console.log('Processed Farm Data:', {
        ...response.data,
        farmTime: remainingFarmTime,
        farmReward: farmReward.toFixed(2),
      });

      if (remainingFarmTime > 0 && response.data.farmStatus === 'farming') {
        startFarmingTimer(remainingFarmTime, farmReward);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        createInitialUser();
      } else {
        console.error('Error fetching farm data:', err);
        setError(`Failed to fetch data. Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createInitialUser = async () => {
    try {
      const res = await axios.post(`https://lunarapp.thelunarcoin.com/backend/api/farm/add`, { userId });
      console.log("Initial user created:", res.data); // Debugging log
      setFarmData(res.data);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        fetchData();
      } else {
        console.error('Error creating initial user:', err);
        setError(`Failed to create initial user. Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setIsFarming(true);
    setButtonText("Farming...");
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const payload = {
        userId,
        farmTime: farmData.farmTime || 21600,
        farmReward: farmData.farmReward || "0.0",
        farmStatus: 'farming',
        lastActiveFarmTime: currentTime,
      };

      console.log('Payload for Start:', payload); // Debugging log

      await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/farm/start`, payload);

      startFarmingTimer(farmData.farmTime, parseFloat(farmData.farmReward));
    } catch (err) {
      console.error('Error starting farming:', err);
      setError(`Failed to start farming. Error: ${err.message}`);
      setIsFarming(false);
      setButtonText("Start");
    }
  };

  const startFarmingTimer = (initialFarmTime, initialFarmReward) => {
    // Clear any existing interval to avoid multiple intervals running simultaneously
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  
    const startTime = Math.floor(Date.now() / 1000);
  
    intervalRef.current = setInterval(() => {
      setFarmData((prevData) => {
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsed = currentTime - startTime;
        const newFarmTime = Math.max(0, initialFarmTime - elapsed);
        const newFarmReward = parseFloat(prevData.farmReward) + 0.01;
  
        if (newFarmTime === 0) {
          clearInterval(intervalRef.current);
          setIsFarming(false);
          setIsClaimable(true);
          setButtonText("Claim");
        }
  
        return {
          ...prevData,
          farmTime: newFarmTime,
          farmReward: newFarmReward.toFixed(2),
          lastActiveFarmTime: startTime, // Update lastActiveFarmTime for tracking
        };
      });
    }, 1000);
  };

  const handleClaim = async () => {
    try {
      const updatedFarmTotal = (parseFloat(farmData.farmTotal) + parseFloat(farmData.farmReward)).toFixed(1);
      const updatedFarmData = {
        ...farmData,
        farmTotal: updatedFarmTotal,
        farmReward: "0.0",
        farmTime: 21600,
        lastActiveFarmTime: 0,
        farmStatus: 'start'
      };

      console.log('Farm Data Before Claim:', farmData);
      console.log('Updated Farm Total:', updatedFarmTotal);
      console.log('Updated Farm Data:', updatedFarmData);

      const response = await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/farm/claim`, { userId, ...updatedFarmData });
      console.log('Backend Response:', response.data);

      setFarmData(updatedFarmData);
      setIsClaimable(false);
      setButtonText("Start");
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError(`Failed to claim reward. Error: ${err.message}`);
    } finally {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    fetchData();
    return () => clearInterval(intervalRef.current);
  }, []);

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
      <p className="text-4xl font-normal text-golden-moon"></p>
      <p className="text-zinc-400 text-center">
        Propel yourself by farming LAR!<br />
        Claim more LAR and reach for the stars!
      </p>
      <div className="bg-zinc-800 bg-opacity-70 text-red-700 w-full max-w-md px-4 py-2 rounded-xl text-center">
        Current farming era: <span className="text-yellow-900">⏰</span> <FormattedTime time={parseInt(farmData.farmTime, 10)} />
      </div>
      <div className="bg-zinc-800 bg-opacity-70 text-card-foreground p-2 rounded-3xl w-full max-w-md text-center min-h-[40vh] flex flex-col justify-center space-y-5">
        <p className="text-zinc-400 text-muted-foreground">Farming era reward</p>
        <p className="text-4xl font-normal text-primary">
          {farmData.farmReward} <span className="text-golden-moon">LAR</span>
        </p>
      </div>
      <div className="space-y-6 w-full flex items-center flex-col">
        <button
          onClick={() => (isClaimable ? handleClaim() : handleStart())}
          className={`text-white hover:bg-secondary/80 px-6 py-3 rounded-xl w-full max-w-md ${isFarming ? "bg-zinc-800 bg-opacity-70" : "bg-gradient-to-r from-golden-moon"}`}
        >
          {buttonText}
        </button>
      </div>
      <div className="w-full max-w-md fixed bottom-0 left-0 flex justify-around bg-zinc-900 py-1">
        <Footer />
      </div>
    </div>
  );
};

export default Farm;
