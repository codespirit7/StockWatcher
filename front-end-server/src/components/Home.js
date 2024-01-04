import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css'

const App = () => {
    const [stocks, setStocks] = useState([]);
    const [selectedStocks, setSelectedStocks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/stocks');
                setStocks(response.data);
            } catch (err) {
                setError(err.message || 'Error fetching stocks');
            }
        };

        fetchStocks();
    }, []);

   useEffect(() => {
    const fetchStockPrices = async () => {
        try {
            const promises = selectedStocks.map(async (stock) => {
                try {
                    const response = await axios.get(`http://localhost:5000/api/stock/${stock.symbol}`);
                    return { ...stock, currentPrice: response.data.currentPrice, error: null };
                } catch (err) {
                    console.error(`Error fetching data for ${stock.symbol}:`, err.message);
                    return { ...stock, error: err.message || 'Error fetching stock price' };
                }
            });

            const updatedStocks = await Promise.all(promises);

            setSelectedStocks((prevStocks) =>
                prevStocks.map((prevStock) =>
                    updatedStocks.find((updatedStock) => updatedStock.symbol === prevStock.symbol) || prevStock
                )
            );
        } catch (error) {
            console.error('Error updating stock prices:', error.message);
        }
    };

    const pollingInterval = setInterval(fetchStockPrices, 1000);

    return () => clearInterval(pollingInterval);
}, [selectedStocks]);

    const handleSelectStocks = (n) => {
      if (n > 20) {
        setError('Please select a value not greater than 20.');
        setSelectedStocks([]); // Clear the selected stocks if there is an error
    } else {
        setError(null);
        setSelectedStocks(stocks.slice(0, n));
    }
    };

    const getDynamicPriceStyle = (currentPrice, openPrice) => {
      return currentPrice > openPrice ? { color: 'green' } : { color: 'red' };
  };

    return (
        <div>
            <h1>Stock App</h1>
            <label>
                Select the number of stocks (not more than 20):
                <input type="number" min="1" max="20" onChange={(e) => handleSelectStocks(e.target.value)} />
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </label>
            <div className="stock-header">
                <span className="column">Stock</span>
                <span className="column">Open Price</span>
                <span className="column">Current Price</span>
            </div>
            {selectedStocks.map((stock) => (
                <div key={stock.symbol} className="stock-details">
                    <span className="column">{stock.symbol}</span>
                    <span className="column">{stock.openPrice}</span>
                    <span className="column" style={getDynamicPriceStyle(stock.currentPrice, stock.openPrice)}>
    {stock.currentPrice || 'Fetching...'}
</span>
                    {stock.error && <span style={{ color: 'red' }}>{stock.error}</span>}
                </div>
            ))}
        </div>
    );
};

export default App;

