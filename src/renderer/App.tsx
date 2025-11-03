import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './Styles/App.css';
import WelcomeScreen from './Screens/WelcomeScreen/WelcomeScreen';
import Home from './Screens/Home/Home';
import { AppRoutes } from './routes/routes';
import ElectronStoreDemo from './Screens/ElectronStore/ElectronStore';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path={AppRoutes.WelcomeScreen} element={<WelcomeScreen />} />
        <Route path={AppRoutes.Home} element={<Home />} />
        <Route path={AppRoutes.ElectronStore} element={<ElectronStoreDemo />} />
      </Routes>
    </Router>
  );
}
