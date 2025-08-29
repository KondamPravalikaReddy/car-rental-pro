// src/components/CarCard.js
import React from 'react';

export default function CarCard({ car }) {
  return (
    <div className="car-card p-4 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer bg-white">
      <img
        src={car.images?.[0]?.url || 'https://via.placeholder.com/400x200'}
        alt={`${car.make} ${car.model}`}
        className="rounded-md w-full h-48 object-cover"
      />
      <h3 className="text-xl font-semibold mt-3 text-gray-900">{car.make} {car.model}</h3>
      <p className="text-gray-700 mt-1">Price per day: <span className="font-medium">${car.pricePerDay}</span></p>
      <p className="text-gray-600 mt-1">Seats: {car.seats} | Fuel: {car.fuel}</p>
      <button
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-300"
        onClick={() => alert('Booking feature coming soon!')}
      >
        Book Now
      </button>
    </div>
  );
}
