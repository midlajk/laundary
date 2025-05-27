import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/dashboards';
import Layout from './components/Layout';
import Customermanagement from './components/customermanagement';
import Services from './components/services';
import NewOrder from './components/neworder';
import Orders from './components/orders';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/customers" element={<Customermanagement />} />
        <Route path="/services" element={<Services />} />
        <Route path="/neworder" element={<NewOrder />} />
        <Route path="/orders" element={<Orders />} />

      </Route>
    </Routes>
  );
}

export default App;
