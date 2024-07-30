import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import FormattedTime from '../Component/FormattedTime';
import './Home.css';
import coin from './logo.png';
import RewardCard from '../Component/RewardCard';
import Footer from '../Component/Footer';
import './bg.css';
import axios from 'axios';

const Home = () => {
  const [userId, setUserId] = useState('743737380');
  const [homeData, setHomeData] = useState({
    tapTime: 14400,
    tapPoint: 100,
    homeBalance: 0,
    tapClaim: 0,
    lastActiveTime: Math.floor(Date.now() / 1000),
  });

  const [loading, setLoading] = useState(true);
  const [isVibrating, setIsVibrating] = useState(false);
  const [showTapButton, setShowTapButton] = useState(false);
  const [showMorrButton, setShowMorrButton] = useState(false);
  const [showRewardCard, setShowRewardCard] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const tapButtonShowCount = 12;
  const morrButtonShowCount = 20;

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

  const fetchData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/home/${userId}/${currentTime}`);
      const now = Math.floor(Date.now() / 1000);

      const lastActiveTime = parseInt(response.data.lastActiveTime, 10) || now;
      const remainingTapTime = parseInt(response.data.tapTime, 10) || 14400;
      const homeBalance = parseFloat(response.data.homeBalance) || 0;
      const tapClaim = parseFloat(response.data.tapClaim) || 0;
      const tapPoint = parseFloat(response.data.tapPoint) || 100;

      const elapsed = now - lastActiveTime;
      if (elapsed > 0) {
        const newTapTime = remainingTapTime - elapsed;
        setHomeData(prevData => ({
          ...prevData,
          tapTime: newTapTime,
          tapPoint: (prevData?.tapPoint ?? 100),
          homeBalance: homeBalance,
          tapClaim: prevData?.tapClaim,
          lastActiveTime: currentTime,
        }));
      }

      // Load tapPoint and tapClaim from localStorage
      const savedTapPoint = parseFloat(localStorage.getItem(`tapPoint_${userId}`)) || 100;
      const savedTapClaim = parseFloat(localStorage.getItem(`tapClaim_${userId}`)) || 0;
      setHomeData(prevData => ({
        ...prevData,
        tapPoint: savedTapPoint,
        tapClaim: savedTapClaim,
      }));
    } catch (err) {
      if (err.response && err.response.status === 404) {
        createInitialUser();
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createInitialUser = async () => {
    try {
      await axios.post('https://lunarapp.thelunarcoin.com/backend/api/home/add', { userId });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // User already exists
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!homeData) return;

    const countdown = setInterval(() => {
      setHomeData(prevData => {
        if (prevData.tapTime > 0) {
          return { ...prevData, tapTime: prevData.tapTime - 1 };
        } else {
          clearInterval(countdown);

          const updateData = {
            ...homeData,
            tapPoint: 100,
            tapTime: 14400,
          };

          axios.put('https://lunarapp.thelunarcoin.com/backend/api/home/update', updateData)
            .then(() => fetchData())
            .catch(err => console.error('Error updating data:', err));

          return { ...homeData, tapPoint: 100, tapTime: 14400 };
        }
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [homeData, fetchData]);

  const handleTap = () => {
    if (homeData?.tapPoint > 0) {
      if (navigator.vibrate) navigator.vibrate(100);

      const numericTapClaim = typeof homeData.tapClaim === 'string' ? parseFloat(homeData.tapClaim) : homeData.tapClaim;

      const updatedUser = {
        ...homeData,
        tapPoint: homeData.tapPoint - 1,
        tapClaim: numericTapClaim + 1,
      };

      // Update local storage
      localStorage.setItem(`tapPoint_${userId}`, updatedUser.tapPoint);
      localStorage.setItem(`tapClaim_${userId}`, updatedUser.tapClaim);

      setClickCount(prevCount => {
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

  const handleClaim = () => {
    if (homeData) {
      const tapClaim = homeData.tapClaim;
      const homeBalance = homeData.homeBalance;

      const numericTapClaim = parseFloat(tapClaim);
      const numericHomeBalance = parseFloat(homeBalance);

      if (!isNaN(numericTapClaim) && numericTapClaim > 0) {
        if (navigator.vibrate) navigator.vibrate(500);

        const updatedUser = {
          ...homeData,
          homeBalance: numericHomeBalance + numericTapClaim,
          tapClaim: 0,
        };

        setShowRewardCard(true);
        setTimeout(() => {
          setShowRewardCard(false);

          axios.put('https://lunarapp.thelunarcoin.com/backend/api/home/update', {
            userId,
            homeBalance: updatedUser.homeBalance,
            tapClaim: 0,
            lastActiveTime: Math.floor(Date.now() / 1000),
          })
            .then(() => {
              // Update local storage
              localStorage.setItem(`tapPoint_${userId}`, updatedUser.tapPoint);
              localStorage.setItem(`tapClaim_${userId}`, updatedUser.tapClaim);
              setHomeData(updatedUser);
            })
            .catch(err => console.error('Error updating data:', err));
        }, 2000);
      } else {
        console.log('No tap claims to redeem.');
      }
    } else {
      console.error('Home data is not available.');
    }
  };

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
    <div className="bg-cover bg-gradient-to-b from-black to-zinc-900 min-h-screen text-white flex flex-col items-center p-4 space-y-4">
      <div className="bg-zinc-800 bg-opacity-70 rounded-lg p-4 w-full max-w-md text-center">
        <p className="text-zinc-500">Your Lunar Tokens</p>
        <p className="text-4xl font-normal">
          {homeData?.homeBalance} <span className="text-golden-moon">LAR</span>
        </p>
      </div>
      <div className="text-center">
        <p>Tap, tap, tap! Can’t stop, won’t stop!</p>
        <p>Timer shows refill, but the fun won’t flop! <span role="img" aria-label="thumbs up">👍</span></p>
      </div>
      <div className="flex space-x-4">
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-9 py-2 text-center">
          <p className="text-golden-moon">{homeData?.tapPoint} taps</p>
        </div>
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-7 py-2 text-center flex items-center space-x-2">
          <span className="text-yellow-900">⏰</span>
          <p className="text-red-700"><FormattedTime time={homeData?.tapTime} /></p>
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
        <p className="px-3 text-xl font-normal">{homeData?.tapClaim} <span className="text-golden-moon px-2 text-xl font-normal">LAR</span></p>
        <button className="bg-golden-moon p-2 px-3 rounded-lg" onClick={handleClaim}>
          Claim
        </button>
      </div>
      <div className="w-full max-w-md fixed bottom-0 left-0 flex justify-around bg-zinc-900 py-1">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
