import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './Styles/App.css'
import WelcomeScreen from './Screens/WelcomeScreen/WelcomeScreen';
import Home from './Screens/Home/Home';
import { AppRoutes } from './routes/routes';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path={AppRoutes.WelcomeScreen} element={<WelcomeScreen />} />
        <Route path={AppRoutes.Home} element={<Home />} />
      </Routes>
    </Router>
  );
}
