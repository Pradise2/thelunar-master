import React, { useState, useEffect } from 'react';
import Footer from '../Component/Footer';
import { ClipLoader } from 'react-spinners';
import './bg.css';
import RCSquad from '../Component/RCSquad';
import axios from 'axios';

const Squad = () => {
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState("003");
  const [username, setUserName] = useState(null)
  const [squadData, setSquadData] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [showRCSquad, setShowRCSquad] = useState(false);
  const [loading, setLoading] = useState(true); // Initialize loading as true
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const { WebApp } = window.Telegram;
      
      // Expand the WebApp
      WebApp.expand();
  
      const user = WebApp.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
        setUserName(user.username)
      } else {
        console.error('User data is not available.');
      }
    } else {
      console.error('Telegram WebApp script is not loaded.');
    }
  }, []);

  useEffect(() => {
    const fetchSquadData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/squad/${userId}`);
        setSquadData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching squad data:', error);
        setError('Error fetching squad data');
        await createInitialUser();
        await fetchSquadData();
      }
    };

    const createInitialUser = async () => {
      try {
        const response = await axios.post(`http://localhost:5000/squad/add`, {
          userId,
          username,
        });
        console.log("Initial user created:", response.data);
        return response.data;
      } catch (err) {
        console.error('Error creating initial user:', err);
        setError('Error creating initial user');
        return null;
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await fetchSquadData();
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const copyToClipboard = () => {
    const reflink = `https://t.me/ThelunarCoin_bot?start=ref_${userId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reflink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      }).catch(err => {
        console.error('Failed to copy text:', err);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = reflink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const calculateTotal = () => {
    if (homeData && squadData) {
      return (homeData.HomeBalance || 0) + (squadData.totalBalance || 0);
    }
    return 0;
  };

  const handleClaim = async () => {
    if (squadData?.referralEarnings > 0) {
      // Vibrate when claiming
      if (navigator.vibrate) {
        navigator.vibrate(500); // Vibrate for 500ms
      }

      const updatedTotalBalance = (squadData.totalBalance || 0) + (squadData.referralEarnings || 0);
      const updatedSquadData = {
        ...squadData,
        totalBalance: updatedTotalBalance,
        referralEarnings: 0,
      };

      setSquadData(updatedSquadData);
      setShowRCSquad(true);

      // Hide RewardCard after 2 seconds
      setTimeout(() => setShowRCSquad(false), 2000);

      // If `addUserToSquad` is not defined or not needed, you can remove this block.
      /*
      try {
        await addUserToSquad(userId, updatedSquadData);
      } catch (error) {
        console.error('Error updating squad data:', error);
      }
      */
    }
  };

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
    <div className="min-h-screen bg-cover text-white flex flex-col items-center p-4 space-y-4">
      <h1 className="text-center text-4xl font-normal">
        The bigger the tribe, <br /> the better the vibe!
      </h1>
      <div className="bg-zinc-800 bg-opacity-70 p-4 rounded-xl w-full max-w-md space-y-2">
        <p className="text-zinc-400 text-center">Total squad balance</p>
        <p className="text-center text-3xl font-normal">
          {(calculateTotal() || 0).toLocaleString()} <span className="text-golden-moon">LAR</span>
        </p>
      </div>
      <div className="bg-zinc-800 bg-opacity-70 p-4 rounded-xl w-full max-w-md space-y-2">
        <p className="text-zinc-400 text-center">Your rewards</p>
        <p className="text-center text-3xl font-normal">
          {(squadData?.referralEarnings || 0).toLocaleString()} <span className="text-golden-moon">LAR</span>
        </p>
        <p className="text-sm mb-4 text-center">10% of your friends' earnings</p>
        <div className="flex p-1 justify-center">
          <button className="bg-golden-moon px-4 py-2 rounded-xl" onClick={handleClaim}>Claim</button>
        </div>
      </div>
      <div className="bg-zinc-800 bg-opacity-70 p-4 rounded-xl w-full max-w-md space-y-2">
        <div className="flex justify-between bg-opacity-70 text-sm items-center bg-zinc-700 rounded-lg py-2 px-3">
          <p className="flex items-center">
            <img aria-hidden="true" alt="team-icon" src="https://openui.fly.dev/openui/24x24.svg?text=👥" className="mr-2" />
            Your team
          </p>
          <p>{(squadData?.referralCount || 0)} users</p>
        </div>
        <div>
          {squadData?.referrals && squadData.referrals.length > 0 ? (
            squadData.referrals.map((referral, index) => (
              <div key={index} className="flex font-normal text-sm justify-between items-center px-3">
                <p className="flex items-center">
                  <img aria-hidden="true" alt="user-icon" src="https://openui.fly.dev/openui/24x24.svg?text=👤" className="mr-2" />
                  {referral.username}
                </p>
                <p className="text-primary">{(referral.referralBonus || 0).toLocaleString()} <span className="text-golden-moon">LAR</span></p>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-zinc-400">No referrals yet.</p>
          )}
        </div>
      </div>
      <div className="w-full max-w-md flex space-x-2 mt-5">
        <button className="flex-1 bg-gradient-to-r from-golden-moon py-2 rounded-lg" onClick={copyToClipboard}>
          Invite friends
        </button>
        <button className="bg-zinc-700 bg-opacity-70 p-2 rounded-lg" onClick={copyToClipboard}>
          {copied ? <span>Copied!</span> : <span>Copy</span>}
        </button>
      </div>
      <div className="w-full max-w-md sticky bottom-0 left-0 flex text-white bg-zinc-900 justify-around py-1">
          <Footer />
        </div>
    </div>
  );
};

export default Squad;
