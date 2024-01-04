const express = require('express');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();

/**
 * CORS setup for cross-origin allow requests.
 * 
 */

const corsOptions = {
    origin: 'http://localhost:3000', 
    credentials: true, 
};

app.use(cors(corsOptions));


const PORT = process.env.PORT || 5000;


const stocksDataFile = 'stocksData.json';

const polygonApiKey = process.env.POLYGON_API_KEY; 
/**
 * Fetch the openPrice from the Polygon API.
 * API_URL : https://api.polygon.io/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${polygonApiKey}
 * 
 */
const stocksList = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NFLX', 'META', 'NVDA', 'PYPL', 'INTC', 'AMD', 'IBM', 'CSCO', 'ORCL', 'QCOM', 'V', 'GS', 'JPM', 'DIS', 'BA'];

const fetchOpenPrice = async (symbol, date) => {
    try {
        const response = await fetch(`https://api.polygon.io/v1/open-close/${symbol}/${date}?adjusted=true&apiKey=${polygonApiKey}`);
        const data = await response.json();
        console.log(data);
        return data.open;
    } catch (error) {
        console.error(`Error fetching open price for ${symbol} on ${date}: ${error.message}`);
        return null;
    }
};

/*****
 * 
 * Create initial data file with open prices fetched from Polygon API for a specific date.
*/
const initializeStocksData = async (date) => {
    if (!fs.existsSync(stocksDataFile)) {
        const initialStocksData = [];

        const fetchWithDelay = async (symbol, date, delay) => {
            try {
                const openPrice = await fetchOpenPrice(symbol, date);
                return { symbol, openPrice };
            } catch (error) {
                console.error(`Error fetching open price for ${symbol}: ${error.message}`);
                return { symbol, openPrice: null };
            } finally {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        };

        /**
         *  Since Polygon Free tier provides 5 API calls per minute. so one call every 12 seconds to fetch all 20 stocks prices.
         */
        const apiCallDelay = 60 * 1000 / 5;


        for (const symbol of stocksList) {
            const { openPrice } = await fetchWithDelay(symbol, date, apiCallDelay);

            if (openPrice !== null) {
                const refreshInterval = Math.floor(Math.random() * 5) + 1;
                const lastUpdate = Date.now() - Math.floor(Math.random() * refreshInterval * 1000);
                const currentPrice = openPrice + (Math.random() * 10 - 5);

                const stock = { symbol, openPrice, refreshInterval, lastUpdate, currentPrice };
                initialStocksData.push(stock);
            }
        }

        fs.writeFileSync(stocksDataFile, JSON.stringify(initialStocksData));
    }
};


/**
 * Update stock prices at their respective "refreshIntervals" and write the updated currentPrice of each stock in stocksDataFile.
 * 
 */
const updateStockPrices = () => {
    const stocksData = JSON.parse(fs.readFileSync(stocksDataFile));

    const updatedStocks = stocksData.map((stock) => {
        if (Date.now() - stock.lastUpdate >= stock.refreshInterval * 1000) {
            stock.currentPrice = stock.openPrice + (Math.random() * 10 - 5);
            stock.lastUpdate = Date.now();
        }

        return stock;
    });

    fs.writeFileSync(stocksDataFile, JSON.stringify(updatedStocks));
};



/****
 * 
 * Initialize stocks data with open prices from Polygon API for a specific date , As the problem statement does not mentioned about date.
 * Default date is set to '2023-12-29'
 */
initializeStocksData('2024-01-02');

/**
 * Update Stock prices at their specific refresh interval 
 */
if(stocksDataFile && fs.existsSync(stocksDataFile)){
setInterval(updateStockPrices, 1000);
}


/****
 * 
 * API_URL :'http:localhost:5000/api/stocks
 * Method : GET
 * Response: Array of JSON objects.
 */
app.get('/api/stocks', (req, res) => {
    const stocksData = JSON.parse(fs.readFileSync(stocksDataFile));
    res.json(stocksData);
});


/****
 * 
 * API_URL :'http:localhost:5000/api/stock/:symbol
 * Method : GET
 * Response: A JSON object.
 */
app.get('/api/stock/:symbol', (req, res) => {
    const { symbol } = req.params;
    const stocksData = JSON.parse(fs.readFileSync(stocksDataFile));
    const stock = stocksData.find(s => s.symbol === symbol);
    if (stock) {
        res.json({ symbol, currentPrice: stock.currentPrice });
    } else {
        res.status(404).json({ error: 'Stock not found' });
    }
});


/***
 * Spinning the server on specified
 */
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

