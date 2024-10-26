import React, { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TemperatureChart = () => {
  const [city, setCity] = useState("");
  const [temperatureData, setTemperatureData] = useState([]);
  const [labels, setLabels] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const geoApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 7);

    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  const handleCityChange = (event) => {
    setCity(event.target.value);
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const fetchCoordinatesAndTemperature = async () => {
    if (!city) {
      setError("Please enter a city");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select a valid date range");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const geoResponse = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${city}&apiKey=${geoApiKey}`
      );
      const geoData = await geoResponse.json();

      if (geoData.features.length === 0) {
        throw new Error("City not found");
      }

      const [lon, lat] = geoData.features[0].geometry.coordinates;

      await fetchTemperatureData(lat, lon);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchTemperatureData = async (lat, lon) => {
    try {
      const weatherResponse = await fetch(
        `https://meteostat.p.rapidapi.com/point/daily?lat=${lat}&lon=${lon}&start=${startDate}&end=${endDate}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "meteostat.p.rapidapi.com",
          },
        }
      );
      const weatherData = await weatherResponse.json();
      const dailyData = weatherData.data;

      const temps = dailyData.map((day) => day.tavg);
      const daysList = dailyData.map((day) => day.date);

      setTemperatureData(temps);
      setLabels(daysList);
      setIsLoading(false);
    } catch (error) {
      setError("Failed to fetch temperature data");
      setIsLoading(false);
    }
  };

  const chartData = useMemo(
    () => ({
      labels: labels,
      datasets: [
        {
          label: `Temperature in ${city}`,
          data: temperatureData,
          borderColor: "rgba(53, 162, 235, 1)",
          backgroundColor: "rgba(53, 162, 235, 0.2)",
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [labels, temperatureData, startDate, endDate]
  );

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Temperature Data for ${city} (${startDate} to ${endDate})`,
        font: {
          size: 18,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Temperature (°C)",
          font: {
            size: 14,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 , width:'100vw'}}>
      <Typography variant="h4" align="center" gutterBottom>
        Temperature Data
      </Typography>
      <Box display="flex" flexDirection="column" gap={3} alignItems="center">
        <TextField
          label="Enter a city"
          variant="outlined"
          value={city}
          onChange={handleCityChange}
          fullWidth
        />
        <Box display="flex" gap={2} width="100%">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchCoordinatesAndTemperature}
          fullWidth
          sx={{ py: 1.5 }}
        >
          Get Temperature Data
        </Button>
      </Box>

      {error && (
        <Typography color="error" align="center" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
      {isLoading && (
        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {temperatureData.length > 0 && !isLoading && (
        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 3,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <Line data={chartData} options={options} />
        </Box>
      )}
    </Container>
  );
};

export default TemperatureChart;
