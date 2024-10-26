import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TemperatureChart from './TemperatureChart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TemperatureChart city="Lagos" />} />
      </Routes>
    </Router>
  );
}

export default App; 
