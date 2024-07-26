import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HomeDataComponent = () => {
  const [userId] = useState("005");
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(`https://lunarapp.thelunarcoin.com/backend/api/home/${userId}`);
      setHomeData(response.data);
    } catch (err) {
      console.error('Error fetching home data:', err);
      setError(`Failed to fetch data. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Cleanup if needed
    return () => {
      // Cancel any pending requests or cleanup operations here
    };
  }, [userId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!homeData) {
    return <p>No data available</p>;
  }

  return (
    <div>
      <h1>Home Data for User: {homeData.username}</h1>
      <p>Username: {homeData.username}</p>
      <p>Home Balance: {homeData.homeBalance}</p>
      <p>Tap Claim: {homeData.tapClaim}</p>
      <p>Tap Point: {homeData.tapPoint}</p>
      <p>Tap Time: {homeData.tapTime}</p>
      <p>Last Active Time: {homeData.LastActiveTime}</p>
    </div>
  );
};

export default HomeDataComponent;
