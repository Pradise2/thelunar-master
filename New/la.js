import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const userId = '90'; // Replace with your actual userId or retrieve dynamically

    const [homeData, setHomeData] = useState([]);
    const [farmData, setFarmData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [farmingStatus, setFarmingStatus] = useState({}); // Track farming status

    const farmingIntervalRef = useRef({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchHomeData();
            await fetchFarmData();
            setLoading(false);
        };

        const fetchHomeData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/home/${userId}`);
                setHomeData(response.data);
            } catch (error) {
                console.error('Error fetching home data:', error);
                setError('Error fetching home data');
            }
        };

        const fetchFarmData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/farm/${userId}`);
                setFarmData(response.data);
            } catch (error) {
                console.error('Error fetching farm data:', error);
                await createInitialUser();
                // Retry fetching farm data after creating the initial user
                const retryResponse = await axios.get(`http://localhost:5000/farm/${userId}`);
                setFarmData(retryResponse.data);
            }
        };

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

        fetchData();

        // Cleanup function for intervals or subscriptions
        return () => {
            Object.values(farmingIntervalRef.current).forEach(clearInterval);
        };
    }, [userId]);

    const updateHomeData = async (updatedData) => {
        try {
            const response = await axios.post(`http://localhost:5000/home/update/${userId}`, updatedData);
            setHomeData(prevHomeData => prevHomeData.map(home => home._id === response.data._id ? response.data : home));
            console.log('Home data updated:', response.data);
        } catch (error) {
            console.error('Error updating home data:', error);
            setError('Error updating home data');
        }
    };

    const updateFarmData = async (farmId, updatedData) => {
        try {
            const response = await axios.post(`http://localhost:5000/farm/update/${userId}`, updatedData);
            setFarmData(prevFarmData => prevFarmData.map(farm => farm._id === response.data._id ? response.data : farm));
            console.log('Farm data updated:', response.data);
        } catch (error) {
            console.error('Error updating farm data:', error);
            setUpdateError('Error updating farm data');
        }
    };

    const handleStartFarming = (farmId) => {
        setFarmingStatus(prevStatus => ({ ...prevStatus, [farmId]: true }));

        farmingIntervalRef.current[farmId] = setInterval(() => {
            setFarmData(prevFarmData =>
                prevFarmData.map(farm => {
                    if (farm._id === farmId) {
                        if (farm.farmTime <= 1) {
                            clearInterval(farmingIntervalRef.current[farmId]);
                            setFarmingStatus(prevStatus => ({ ...prevStatus, [farmId]: false }));
                            return { ...farm, farmTime: 0, farmReward: farm.farmReward, buttonLabel: 'Claim' };
                        } else {
                            const updatedFarmTime = farm.farmTime - 1;
                            const updatedFarmReward = farm.farmReward + 0.1;
                            const updatedFarm = { ...farm, farmTime: updatedFarmTime, farmReward: updatedFarmReward };
                            updateFarmData(farmId, updatedFarm);
                            return updatedFarm;
                        }
                    }
                    return farm;
                })
            );
        }, 1000);
    };

    const handleClaimReward = async (farmId) => {
        try {
            const farm = farmData.find(f => f._id === farmId);
            if (!farm) return;

            const home = homeData.find(h => h.userId === userId);
            if (!home) return;

            const updatedHomeBalance = home.homeBalance + farm.farmReward;
            const updatedHomeData = { ...home, homeBalance: updatedHomeBalance };
            const updatedFarmData = { ...farm, farmReward: 0, farmTime: 60 }; // Reset farmReward and farmTime

            // Update the home data and farm data on the server
            await updateHomeData(updatedHomeData);
            await updateFarmData(farmId, updatedFarmData);

            // Update the state with new home and farm data
            setHomeData(prevHomeData => prevHomeData.map(h => h._id === home._id ? updatedHomeData : h));
            setFarmData(prevFarmData => prevFarmData.map(f => f._id === farm._id ? updatedFarmData : f));

            console.log(`Claimed reward for farmId: ${farmId}`);
        } catch (error) {
            console.error('Error claiming reward:', error);
            setError('Error claiming reward');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='flex flex-col justify-between'>
            <div>
                <h2>Home Data for User ID: {userId}</h2>
                <ul>
                    {homeData.map(home => (
                        <li key={home._id}>
                            <p>Username: {home.username}</p>
                            <p>Home Balance: {home.homeBalance}</p>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h2>Farm Data for User ID: {userId}</h2>
                <ul>
                    {farmData.map(farm => (
                        <li key={farm._id}>
                            <p>User ID: {farm.userId}</p>
                            <p>Farm LastActiveTime: {farm.LastActiveFarmTime}</p>
                            <p>Farm Reward: {farm.farmReward.toFixed(1)}</p>

                            <p>Farm Time: {farm.farmTime.toFixed(1)}</p>
                            <button
                                onClick={() => farm.farmTime === 0 ? handleClaimReward(farm._id) : handleStartFarming(farm._id)}
                                disabled={farmingStatus[farm._id] && farm.farmTime !== 0}
                            >
                                {farm.farmTime === 0 ? 'Claim' : farmingStatus[farm._id] ? 'Farming' : 'Start'}
                            </button>
                        </li>
                    ))}
                </ul>
                {updateError && <div>{updateError}</div>}
            </div>
        </div>
    );
};

export default Dashboard;
