import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import { addUserToFarm, getUserFromFarm, updateHomeBalance, getUserFromHome } from '../utils/firestoreFunctions';
import FormattedTime from '../Component/FormattedTime';
import './bg.css';
import { ClipLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';
import RCFarm from '../Component/RCFarm';

const Farm = () => {
  const [userData, setUserData] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [userId, setUserId] = useState("743737380");
  const [buttonText, setButtonText] = useState("Start");
  const [showRCFarm, setShowRCFarm] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const { WebApp } = window.Telegram;
      
      // Expand the WebApp
      WebApp.expand();
  
      const user = WebApp.initDataUnsafe?.user;
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
    const fetchUserData = async () => {
      try {
        const data = await getUserFromFarm(userId);
        const currentTime = Math.floor(Date.now() / 1000);

        if (data) {
          const elapsed = currentTime - data.LastFarmActiveTime;
          const newFarmTime = data.FarmTime - elapsed;

          if (newFarmTime <= 0) {
            setUserData({
              ...data,
              FarmTime: 0,
              FarmReward: data.FarmReward + data.FarmTime * 0.1,
              LastFarmActiveTime: currentTime,
            });
            setButtonText("Claim");
          } else {
            setUserData({
              ...data,
              FarmTime: newFarmTime,
              FarmReward: data.FarmReward + elapsed * 0.1,
              LastFarmActiveTime: currentTime,
            });
            setButtonText("Farming...");
          }
        } else {
          const initialData = {
            FarmTime: 60,
            FarmReward: 0,
            LastFarmActiveTime: currentTime,
          };
          await addUserToFarm(userId, initialData);
          setUserData(initialData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const data = await getUserFromHome(userId);
        setHomeData(data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };

    fetchHomeData();
  }, [userId]);

  useEffect(() => {
    let interval;
    if (buttonText === "Farming...") {
      interval = setInterval(() => {
        if (userData) {
          const currentTime = Math.floor(Date.now() / 1000);
          const elapsed = currentTime - userData.LastFarmActiveTime;
          const newFarmTime = userData.FarmTime - elapsed;

          if (newFarmTime <= 0) {
            setUserData((prevState) => ({
              ...prevState,
              FarmTime: 0,
              FarmReward: prevState.FarmReward + prevState.FarmTime * 0.1,
              LastFarmActiveTime: currentTime,
            }));
            setButtonText("Claim");
          } else {
            setUserData((prevState) => ({
              ...prevState,
              FarmTime: newFarmTime,
              FarmReward: prevState.FarmReward + elapsed * 0.1,
              LastFarmActiveTime: currentTime,
            }));
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [buttonText, userData]);

  useEffect(() => {
    const saveUserData = async () => {
      if (userId && userData) {
        await addUserToFarm(userId, userData);
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

  const handleButtonClick = async () => {
    if (buttonText === "Start") {
      setButtonText("Farming...");
      setUserData((prevState) => ({
        ...prevState,
        LastFarmActiveTime: Math.floor(Date.now() / 1000),
      }));
    } else if (buttonText === "Claim" && homeData) {
    if (userData?.FarmReward > 0) {
    if (navigator.vibrate) {
      navigator.vibrate(500); // Vibrate for 500ms
    }
      try {
        const newHomeBalance = homeData.HomeBalance + userData.FarmReward;
        await updateHomeBalance(userId, newHomeBalance);
        setHomeData((prevState) => ({
          ...prevState,
          HomeBalance: newHomeBalance,
        }));
        setUserData((prevState) => ({
          ...prevState,
          FarmReward: 0,
          FarmTime: 60,
        }));
        setShowRCFarm(true);
        setTimeout(() => setShowRCFarm(false), 2000);
        setButtonText("Start");
      } catch (error) {
        console.error('Error claiming reward:', error);
      }
    }
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
    <div className="min-h-screen bg-cover text-white flex flex-col items-center p-4 space-y-6">
      <h1 className="text-4xl font-normal">Farm LAR tokens</h1>
      <p className="text-zinc-400 text-center">
      Propel yourself by farming LAR!<br />
      Claim more LAR and reach for the stars!
      </p>
      <div className="bg-zinc-800 bg-opacity-70 text-red-700 w-full max-w-md px-4 py-2 rounded-xl text-center">
        Current farming era: <span className="text-yellow-900">⏰</span> <FormattedTime time={userData?.FarmTime} />
      </div>
      <div className="bg-zinc-800 bg-opacity-70 text-card-foreground p-2 rounded-3xl w-full max-w-md text-center min-h-[40vh] flex flex-col justify-center space-y-4">
        <p className="text-zinc-400 text-muted-foreground">Farming era reward</p>
        <p className="text-4xl font-normal text-primary">
          {userData?.FarmReward.toFixed(1)} <span className="text-golden-moon">LAR</span>
        </p>
      </div>
      <div className="space-y-6 w-full flex items-center flex-col">
        <button
          className={`text-white hover:bg-secondary/80 px-6 py-3 rounded-xl w-full max-w-md ${buttonText === "Farming..." ? "bg-zinc-800 bg-opacity-70" : "bg-gradient-to-r from-golden-moon"}`}
          onClick={handleButtonClick}
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