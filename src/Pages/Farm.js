import React, { useState, useEffect, useRef } from 'react';
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
  const [userId, setUserId] = useState("029");
  const [loading, setLoading] = useState(true);
  const [isFarming, setIsFarming] = useState(false);
  const [isClaimable, setIsClaimable] = useState(false);
  const [buttonText, setButtonText] = useState("Start");
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/farm/${userId}`);
      setFarmData(response.data);
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
      console.log("Initial user created:", res.data);
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

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/home/${userId}`);
      setHomeData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
      } else {
        console.error('Error fetching home data:', err);
        setError(`Failed to fetch data. Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setIsFarming(true);
    setButtonText("Farming...");  
    try {
      await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/farm/start`, { userId });
      intervalRef.current = setInterval(() => {
        setFarmData(prevData => {
          const newFarmTime = prevData.farmTime > 0 ? prevData.farmTime - 1 : 0;
          if (newFarmTime === 0) {
            clearInterval(intervalRef.current);
            setIsFarming(false);
            setIsClaimable(true);
            setButtonText("Claim");
          }
          return {
            ...prevData,
            farmTime: newFarmTime,
            farmReward: (parseFloat(prevData.farmReward) + 0.1).toFixed(1)
          };
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting farming:', err);
      setError(`Failed to start farming. Error: ${err.message}`);
      setIsFarming(false);
      setButtonText("Start");
    }
  };

  const handleClaim = async () => {
    try {
      // Update farmTotal by adding farmReward
      const updatedFarmTotal = (parseFloat(farmData.farmTotal) + parseFloat(farmData.farmReward)).toFixed(1);
      const updatedFarmData = {
        ...farmData,
        farmTotal: updatedFarmTotal,
        farmReward: "0.0", 
        farmTime: 240, 
      };

      // Log values for debugging
      console.log('Farm Data Before Claim:', farmData);
      console.log('Updated Farm Total:', updatedFarmTotal);
      console.log('Updated Farm Data:', updatedFarmData);

      // Send the updated farm data to the backend
      await axios.put(`https://lunarapp.thelunarcoin.com/backend/api/farm/claim`, { userId, ...updatedFarmData });

      // Update state and UI
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
    fetchHomeData();
    return () => clearInterval(intervalRef.current); // Clear interval on component unmount
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
      <p className="text-4xl font-normal text-golden-moon">
        {farmData.farmTotal}
      </p>
      <p className="text-zinc-400 text-center">
        Propel yourself by farming LAR!<br />
        Claim more LAR and {farmData.userId} reach for the stars!
      </p>
      <div className="bg-zinc-800 bg-opacity-70 text-red-700 w-full max-w-md px-4 py-2 rounded-xl text-center">
        Current {homeData ? homeData.homeBalance : 0} farming era: <span className="text-yellow-900">⏰</span> <FormattedTime time={farmData.farmTime} />
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
