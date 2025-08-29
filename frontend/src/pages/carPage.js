// src/pages/CarsPage.js
import React, { useEffect, useState } from 'react';
import { fetchCars } from '../api/cars';
import CarCard from '../components/CarCard';

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCars()
      .then(data => {
        setCars(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center mt-10 text-lg">Loading cars...</p>;

  if (!cars.length) return <p className="text-center mt-10 text-lg">No cars available at this time.</p>;

  return (
    <div className="cars-page max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Available Cars</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {cars.map(car => (
          <CarCard key={car._id} car={car} />
        ))}
      </div>
    </div>
  );
}
