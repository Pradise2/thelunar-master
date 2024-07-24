import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulseLoader, ClipLoader } from 'react-spinners';
import FormattedTime from '../Component/FormattedTime';
import './Home.css'; // Make sure to import the CSS file
import coin from './logo.png';
import RewardCard from '../Component/RewardCard';
import Footer from '../Component/Footer';
import './bg.css';
import axios from 'axios';

const Home = () => {
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState("005"); // Initial userId state
  const [loading, setLoading] = useState(true); // Loading state
  const [showTapButton, setShowTapButton] = useState(false);
  const [showMorrButton, setShowMorrButton] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isVibrating, setIsVibrating] = useState(false); // State for vibration
  const [showRewardCard, setShowRewardCard] = useState(false); // State to control RewardCard visibility

  const tapButtonShowCount = 12; // Show TAP-TAP-TAP button after 3 clicks
  const morrButtonShowCount = 20; // Show MORRR!!! button after 6 clicks

  useEffect(() => {
    const fetchData = async (id) => {
      try {
        const res = await axios.get(`http://localhost:5000/home/${id}`);
        return res.data;
      } catch (err) {
        console.error('Error fetching data:', err);
        return null;
      }
    };

    const createInitialUser = async (id) => {
      try {
        const res = await axios.post(`http://localhost:5000/home/add`, {
          userId: id.toString(),
        });
        console.log("Initial user created:", res.data);
        return res.data;
      } catch (err) {
        console.error('Error creating initial user:', err);
        return null;
      }
    };

    fetchData(userId).then((data) => {
      if (data) {
        setData(data);
        const now = Math.floor(Date.now() / 1000);
        const updatedData = data.map((user) => {
          const elapsed = now - user.LastActiveTime;
          user.tapTime = Math.max(user.tapTime - elapsed, 0);
          user.LastActiveTime = now; // Update LastActiveTime to current time
          if (user.tapTime === 0) {
            return resetTap(user);
          }
          return user;
        });
        setData(updatedData);
      } else {
        createInitialUser(userId);
      }
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setData((prevData) =>
        prevData.map((user) => {
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - user.LastActiveTime;

          if (user.tapTime > 0) {
            const updatedUser = { ...user, tapTime: Math.max(user.tapTime - 1, 0) };
            updateUserInDatabase(updatedUser);
            return updatedUser;
          } else {
            return resetTap(user);
          }
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const updateUserInDatabase = async (user) => {
    try {
      await axios.post(`http://localhost:5000/home/update/${user.userId}`, user);
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const resetTap = (user) => {
    const updatedUser = {
      ...user,
      tapPoint: 10, // Default value
      tapTime: 300, // Default value (5 minutes in seconds)
      LastActiveTime: Math.floor(Date.now() / 1000), // Reset LastActiveTime
    };

    updateUserInDatabase(updatedUser);
    return updatedUser;
  };

  const handleClaim = async (user) => {
    // Check if tapClaim is greater than 0 before allowing claim
    if (user.tapClaim > 0) {
      // Vibrate when claiming
      if (navigator.vibrate) {
        navigator.vibrate(500); // Vibrate for 500ms
      }
  
      // Update user data locally first
      const updatedUser = {
        ...user,
        homeBalance: user.homeBalance + user.tapClaim,
        tapClaim: 0,
        LastActiveTime: Math.floor(Date.now() / 1000), // Update LastActiveTime
      };
  
      // Show RewardCard immediately
      setShowRewardCard(true);
  
      // Hide RewardCard after 2 seconds
      setTimeout(async () => {
        setShowRewardCard(false);
  
        try {
          // Update user data on the server after 2 seconds
          await axios.post(`http://localhost:5000/home/update/${user.userId}`, updatedUser);
  
          // Update local state after successful server update
          setData((prevData) =>
            prevData.map((item) =>
              item.userId === user.userId ? { ...item, ...updatedUser } : item
            )
          );
        } catch (err) {
          console.error('Error updating user:', err);
          alert('An error occurred. Please try again.');
        }
      }, 2000);
    } else {
      alert("No tap points left to claim.");
    }
  };
  
  

  const handleTap = async (user) => {
    // Check if TapPoint is greater than 0
    if (user.tapPoint > 0) {
      // Trigger vibration
      if (navigator.vibrate) {
        navigator.vibrate(100); // Vibrate for 100ms
      }

      // Update TapPoint and TapClaim
      const updatedUser = {
        ...user,
        tapPoint: user.tapPoint - 1,
        tapClaim: user.tapClaim + 1,
        LastActiveTime: Math.floor(Date.now() / 1000), // Update LastActiveTime
      };

      // Increment click count and show buttons
      setClickCount((prevCount) => {
        const newCount = prevCount + 1;

        // Show the TAP-TAP-TAP button after the specified number of clicks
        if (newCount % tapButtonShowCount === 0) {
          setShowTapButton(true);
          setTimeout(() => setShowTapButton(false), 600);
        }

        // Show the MORRR!!! button after the specified number of clicks
        if (newCount % morrButtonShowCount === 0) {
          setShowMorrButton(true);
          setTimeout(() => setShowMorrButton(false), 600);
        }

        return newCount;
      });

      // Trigger vibration animation
      setIsVibrating(true);
      setTimeout(() => setIsVibrating(false), 100); // Stop vibration after the animation duration

      try {
        await axios.post(`http://localhost:5000/home/update/${user.userId}`, updatedUser);
        setData(data.map(item => item._id === user._id ? { ...item, ...updatedUser } : item));
      } catch (err) {
        console.error('Error updating user:', err);
        alert('An error occurred. Please try again.');
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
    <div className="bg-cover bg-gradient-to-b from-black to-zinc-900 min-h-screen text-white flex flex-col items-center p-4 space-y-4">
  {data.map((user) => (
    <React.Fragment key={user.userId}>
      <div className="bg-zinc-800 bg-opacity-70 rounded-lg p-4 w-full max-w-md text-center">
        <p className="text-zinc-500">Your Lunar Tokens</p>
        <p className="text-4xl font-normal">{user.homeBalance} <span className="text-golden-moon">LAR</span></p>
      </div>
      <div className="text-center">
        <p>Tap, tap, tap! Can’t stop, won’t stop!</p>
        <p>Timer shows refill, but the fun won’t flop! <span role="img" aria-label="thumbs up">👍</span></p>
      </div>
      <div className="flex space-x-4">
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-9 py-2 text-center">
          <p className="text-golden-moon">{user.tapPoint} taps</p>
        </div>
        <div className="bg-zinc-800 bg-opacity-70 rounded-xl px-7 py-2 text-center flex items-center space-x-2">
          <span className="text-yellow-900">⏰</span>
          <p className="text-red-700"><FormattedTime time={user.tapTime} /></p>
        </div>
      </div>
      <div className="relative mb-3 pb-">
        <motion.img
          id="click"
          onClick={() => handleTap(user)}
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
        <p className="px-3 text-xl font-normal">{user.tapClaim} <span className="text-golden-moon px-2 text-xl font-normal">LAR</span></p>
        <button className="bg-golden-moon p-2 px-3 rounded-lg" onClick={() => handleClaim(user)}>
          Claim
        </button>
      </div>
    </React.Fragment>
  ))}

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
    <RewardCard onClose={() => setShowRewardCard(false)} user={data[0]} />
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
    