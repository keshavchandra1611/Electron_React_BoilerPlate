import React from 'react';
import { useTypedNavigation } from '../../routes/routes';

const Home = () => {
  const { goBack } = useTypedNavigation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      {/* Heading */}
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Home</h1>

      {/* Content Box */}
      <div className="border-2 border-black p-16 rounded-xl shadow-md bg-white mb-8">
        <p className="text-lg text-gray-700">Hello, I have a black border!</p>
      </div>

      {/* Go Back Button */}
      <button
        onClick={goBack}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md"
      >
        Go Back
      </button>
    </div>
  );
};

export default Home;
