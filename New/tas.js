import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const userId = '4'; // Replace with your actual userId or retrieve dynamically

    const [homeData, setHomeData] = useState([]);
    const [farmData, setFarmData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch home data by userId
        const fetchHomeData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/home/${userId}`);
                setHomeData(response.data);
            } catch (error) {
                console.error('Error fetching home data:', error);
                setError('Error fetching home data');
            }
        };

        // Function to fetch farm data by userId
        const fetchFarmData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/farm/${userId}`);
                setFarmData(response.data);
            } catch (error) {
                console.error('Error fetching farm data:', error);
                await createInitialUser();
                await fetchFarmData(); // Refetch the farm data after creating initial user
            }
        };

        // Function to create initial user if not exist
        const createInitialUser = async () => {
            try {
                const response = await axios.post(`http://localhost:5000/farm/add`, {
                    userId,
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
            await fetchHomeData();
            await fetchFarmData();
            setLoading(false);
        };

        // Call fetchData on component mount
        fetchData();
    }, [userId]); // Include userId in the dependency array to fetch data when userId changes

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

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
