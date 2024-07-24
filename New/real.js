import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const userId = '4007'; // Replace with your actual userId or retrieve dynamically

    const [homeData, setHomeData] = useState([]);
    const [farmData, setFarmData] = useState([]);

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

        // Function to fetch farm data by userId
        const fetchFarmData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/farm/${userId}`);
                setFarmData(response.data);
            } catch (error) {
                console.error('Error fetching farm data:', error);
            }
        };

        // Call both functions on component mount
        fetchHomeData();
        fetchFarmData();
    }, [userId]); // Include userId in the dependency array to fetch data when userId changes

    return (
        <div>
            <h2>Home Data for User ID: {userId}</h2>
            <ul>
                {homeData.map(home => (
                    <li key={home._id}>
                        <p>Username: {home.username}</p>
                        <p>Home Balance: {home.homeBalance}</p>
                        {/* Add more fields as needed */}
                    </li>
                ))}
            </ul>

            <h2>Farm Data for User ID: {userId}</h2>
            <ul>
                {farmData.map(farm => (
                    <li key={farm._id}>
                        <p>User ID: {farm.userId}</p>
                        <p>Farm Reward: {farm.farmReward}</p>
                        {/* Add more fields as needed */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Dashboard;
