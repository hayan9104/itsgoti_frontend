const Approach = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Our Approach
        </h1>
        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Placeholder - Will be updated with Figma design
        </p>

        {/* Placeholder content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">{num}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Step {num}
              </h3>
              <p className="text-gray-600">
                This content will be updated based on the Figma design.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Approach;
