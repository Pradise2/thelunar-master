import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import FormattedTime from '../Component/FormattedTime';
import './Home.css'; 
import coin from './logo.png';
import RewardCard from '../Component/RewardCard';
import Footer from '../Component/Footer';
import './bg.css';
import axios from 'axios';


const Home = () => {
  const [userId] = useState("020");
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVibrating, setIsVibrating] = useState(false);
  const [showTapButton, setShowTapButton] = useState(false);
  const [showMorrButton, setShowMorrButton] = useState(false);
  const [showRewardCard, setShowRewardCard] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const tapButtonShowCount = 12; // Show TAP-TAP-TAP button after 12 clicks
  const morrButtonShowCount = 20; // Show MORRR!!! button after 20 clicks

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/home/${userId}`);
      setHomeData(response.data);
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
      const res = await axios.post(`https://lunarapp.thelunarcoin.com/backend/api/home/add`, { userId });
      console.log("Initial user created:", res.data);
      setHomeData(res.data);
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

  useEffect(() => {
    const storedHomeData = localStorage.getItem('homeData');
    const storedTapTime = localStorage.getItem('tapTime');
    const lastUpdateTime = localStorage.getItem('lastUpdateTime');

    if (storedHomeData) {
      const data = JSON.parse(storedHomeData);
      let adjustedTapTime = data.tapTime;

      if (storedTapTime && lastUpdateTime) {
        const elapsedTime = Math.floor(Date.now() / 1000) - parseInt(lastUpdateTime, 10);
        adjustedTapTime = Math.max(0, parseInt(storedTapTime, 10) - elapsedTime);
      }

      setHomeData({
        ...data,
        tapTime: adjustedTapTime,
      });
      setLoading(false);
    } else {
      fetchData();
    }

    return () => {};
  }, [userId]);

  useEffect(() => {
    if (homeData) {
      localStorage.setItem('homeData', JSON.stringify(homeData));
      localStorage.setItem('tapTime', homeData.tapTime);
      localStorage.setItem('lastUpdateTime', Math.floor(Date.now() / 1000));
    }
  }, [homeData]);

  useEffect(() => {
    if (!homeData) return;

    const countdown = setInterval(() => {
      setHomeData(prevData => {
        if (prevData.tapTime > 0) {
          const newTapTime = prevData.tapTime - 1;
          localStorage.setItem('tapTime', newTapTime);
          localStorage.setItem('lastUpdateTime', Math.floor(Date.now() / 1000));
          return { ...prevData, tapTime: newTapTime };
        } else {
          clearInterval(countdown);
          const updatedUser = { ...prevData, tapPoint: 1000, tapTime: 180 }; // Reset tapPoint and tapTime
          localStorage.setItem('tapTime', updatedUser.tapTime);
          localStorage.setItem('lastUpdateTime', Math.floor(Date.now() / 1000));
          return updatedUser;
        }
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [homeData]);

  const handleTap = async () => {
    if (homeData.tapPoint > 0) {
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
  
      const numericTapClaim = typeof homeData.tapClaim === 'string' ? parseFloat(homeData.tapClaim) : homeData.tapClaim;
  
      const updatedUser = {
        ...homeData,
        tapPoint: homeData.tapPoint - 1,
        tapClaim: numericTapClaim + 1, 
        LastActiveTime: Math.floor(Date.now() / 1000),
      };
  
      setClickCount((prevCount) => {
        const newCount = prevCount + 1;
  
        if (newCount % tapButtonShowCount === 0) {
          setShowTapButton(true);
          setTimeout(() => setShowTapButton(false), 600);
        }
  
        if (newCount % morrButtonShowCount === 0) {
          setShowMorrButton(true);
          setTimeout(() => setShowMorrButton(false), 600);
        }
  
        return newCount;
      });
  
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 100);
  
      setHomeData(updatedUser);
    }
  };

  const handleClaim = async () => {
    if (homeData.tapClaim > 0) {
      if (navigator.vibrate) {
        navigator.vibrate(500);
      }

      const numericTapClaim = typeof homeData.tapClaim === 'string' ? parseFloat(homeData.tapClaim) : homeData.tapClaim;
      const numericHomeBalance = typeof homeData.homeBalance === 'string' ? parseFloat(homeData.homeBalance) : homeData.homeBalance;
  
      const updatedUser = {
        ...homeData,
        homeBalance: numericHomeBalance + numericTapClaim,
        tapClaim: 0,
        LastActiveTime: Math.floor(Date.now() / 1000),
      };
  
      setShowRewardCard(true);
      setTimeout(() => {
        setShowRewardCard(false);
        setHomeData(updatedUser);
      }, 2000);
    }
  };
  
  useEffect(() => {
    if (!homeData) return;
  
    const countdown = setInterval(async () => {
      setHomeData(prevData => {
        if (prevData.tapTime > 0) {
          const newTapTime = prevData.tapTime - 1;
          localStorage.setItem('tapTime', newTapTime);
          return { ...prevData, tapTime: newTapTime };
        } else {
          clearInterval(countdown);
          
          const updateData = {
            ...homeData,
            tapPoint: 1000, 
            tapTime: 180, 
          };
  
          axios.put('https://lunarapp.thelunarcoin.com/backend/api/home/update', updateData)
            .then(response => {
              console.log('Data updated successfully:', response.data);
              
              localStorage.removeItem('homeData');
              localStorage.removeItem('tapTime');
              localStorage.removeItem('lastUpdateTime');
            
              fetchData();
            })
            .catch(err => {
              console.error('Error updating data:', err);
            });
  
          return { ...homeData, tapPoint: 1000, tapTime: 180 }; // Ensure data is reset
        }
      });
    }, 1000);
  
    return () => clearInterval(countdown);
  }, [homeData]);
  

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

  if (error) {
    return <p>{error}</p>;
  }

  if (!homeData) {
    return <p>No data available</p>;
  }
  
  return (
    <div className="bg-cover bg-gradient-to-b from-black to-zinc-900 min-h-screen text-white flex flex-col items-center p-4 space-y-4">
      <div className="bg-zinc-800 bg-opacity-70 rounded-lg p-4 w-full max-w-md text-center">
        <p className="text-zinc-500">Your {homeData.userId} Lunar Tokens</p>
        <p className="text-4xl font-normal">{homeData.homeBalance} <span className="text-golden-moon">LAR</span></p>
      </div>
      <div className="text-center">
        <p>Tap, tap, tap! Can’t stop, won’t stop!</p>
        <p>Timer shows refill, but the fun won’t flop! <span role="img" aria-label="thumbs up">👍</span></p>
      </div>
      <div className="flex space-x-4">
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-9 py-2 text-center">
          <p className="text-golden-moon">{homeData.tapPoint} taps</p>
        </div>
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-7 py-2 text-center flex items-center space-x-2">
          <span className="text-yellow-900">⏰</span>
          <p className="text-red-700"><FormattedTime time={homeData.tapTime} /></p>
        </div>
      </div>
      <div className="relative mb-3 pb-">
        <motion.img
          id="click"
          onClick={handleTap}
          src={coin}
          alt="LAR Coin"
          className="w-60 h-58 rounded-full"
          animate={isVibrating ? { x: [0, -10, 0, 10, 0] } : { y: [0, -10, 0, 10, 0] }}
          transition={{ duration: 0.2 }}
        />
        {showTapButton && (
          <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 pb-8 button-animation move-tap">
            <button className="bg-white bg-opacity-70 text-black font-normal px-4 py-2 rounded-full shadow-lg">TAP-TAP-TAP</button>
          </div>
        )}
        {showMorrButton && (
          <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 pt-3 ml-0 button-animation move-morr">
            <button className="bg-white bg-opacity-70 text-black font-normal px-4 py-2 rounded-full shadow-lg">MORRR!!!</button>
          </div>
        )}
      </div>
      <div className="bg-zinc-800 bg-opacity-70 rounded-xl p-2 w-full max-w-md flex text-sm font-normal justify-between items-center py-5">
        <p className="px-3 text-xl font-normal">{homeData.tapClaim} <span className="text-golden-moon px-2 text-xl font-normal">LAR</span></p>
        <button className="bg-golden-moon p-2 px-3 rounded-lg" onClick={handleClaim}>
          Claim
        </button>
      </div>
      <AnimatePresence>
        {showRewardCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={() => setShowRewardCard(false)} // Click anywhere to close RewardCard
          >
            <RewardCard onClose={() => setShowRewardCard(false)} user={homeData} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md fixed bottom-0 left-0 flex justify-around bg-zinc-900 py-1">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
