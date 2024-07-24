import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RewardCard = () => {
  const [userId, setUserId] = useState("4");
  const [homeData, setHomeData] = useState([]);

  useEffect(() => {
    // Function to fetch home data by userId
    const fetchHomeData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/home/${userId}`);
        setHomeData(response.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };

    // Call fetchHomeData function on component mount
    fetchHomeData();
  }, [userId]);

  return (
    <div className="flex max-w-md items-center justify-center w-full min-h-screen backdrop-blur-sm">
      {homeData.map(home => (
        <div key={home._id} className="bg-zinc-800 text-white rounded-xl p-6 shadow-lg w-80">
          <div className="flex flex-col items-center">
            <div className="bg-green-500 rounded-full p-2 mb-4">
              <img aria-hidden="true" alt="checkmark" src="https://openui.fly.dev/openui/24x24.svg?text=✔️" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Woo hoo!</h2>
            <p className="text-4xl font-medium text-white mb-2">+{home.tapClaim.toLocaleString()} <span className="text-golden-moon">LAR</span></p>
            <p className="text-center text-gray-300 mb-4">Stay shining, keep grinding, in every cloud, find that silver lining. Get more LAR!</p>
            <button className="bg-transparent border border-white text-white px-4 py-2 rounded-full hover:bg-white hover:text-zinc-500 transition-colors">
              Morrrre!
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RewardCard;
