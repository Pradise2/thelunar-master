import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const userId = '210'; // Replace with your actual userId or retrieve dynamically

    const [homeData, setHomeData] = useState([]);
    const [farmData, setFarmData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);

    const farmingIntervalRef = useRef(null);

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
                await fetchFarmData();
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

    const updateFarmData = async (updatedData) => {
        try {
            const response = await axios.post(`http://localhost:5000/farm/update/${userId}`, updatedData);
            setFarmData(prevFarmData => prevFarmData.map(farm => farm._id === response.data._id ? response.data : farm));
            console.log('Farm data updated:', response.data);
        } catch (error) {
            console.error('Error updating farm data:', error);
            setUpdateError('Error updating farm data');
        }
    };

    const handleStartFarming = async (farm) => {
        let updatedFarmData = { ...farm, isFarming: true };
        await updateFarmData(updatedFarmData);

        if (farmingIntervalRef.current) {
            clearInterval(farmingIntervalRef.current);
        }

        farmingIntervalRef.current = setInterval(async () => {
            if (updatedFarmData.farmTime > 0) {
                updatedFarmData = {
                    ...updatedFarmData,
                    farmTime: Math.max(updatedFarmData.farmTime - 1, 0),
                    farmReward: updatedFarmData.farmReward + 0.1,
                };
                await updateFarmData(updatedFarmData);
            } else {
                clearInterval(farmingIntervalRef.current);
                updatedFarmData = { ...updatedFarmData, isFarming: false, canClaim: true };
                await updateFarmData(updatedFarmData);
            }
        }, 1000);
    };

    const handleClaimReward = async (farm) => {
        const home = homeData[0];
        const updatedHomeData = {
            ...home,
            homeBalance: home.homeBalance + farm.farmReward,
        };
        await updateHomeData(updatedHomeData);

        const updatedFarmData = {
            ...farm,
            farmReward: 0,
            farmTime: 60, // Reset the farm time to initial value (assumed 60 seconds)
            canClaim: false,
        };
        await updateFarmData(updatedFarmData);
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
                            <button onClick={() => updateHomeData({ ...home, homeBalance: home.homeBalance + 10 })}>
                                Update Home Balance
                            </button>
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
                            <p>Farm Reward: {farm.farmReward.toFixed(1)}</p>
                            <p>Farm Time: {farm.farmTime.toFixed(1)}</p>
                            {farm.canClaim ? (
                                <button onClick={() => handleClaimReward(farm)}>Claim</button>
                            ) : (
                                <button
                                    onClick={() => handleStartFarming(farm)}
                                    disabled={farm.isFarming}
                                >
                                    {farm.isFarming ? 'Farming...' : 'Start'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                {updateError && <div>{updateError}</div>}
            </div>
        </div>
    );
};

export default Dashboard;
