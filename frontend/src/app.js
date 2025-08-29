// Car Rental Management System - Fixed Version
const { useState, useEffect, useContext, createContext, useCallback } = React;
const { createRoot } = ReactDOM;

// Mock data
const mockData = {
  cars: [
    {
      id: 1,
      make: "Toyota",
      model: "Camry",
      year: 2024,
      type: "sedan",
      seats: 5,
      transmission: "automatic",
      fuel: "hybrid",
      pricePerDay: 45,
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400",
      features: ["GPS", "Bluetooth", "AC", "Backup Camera"],
      available: true,
      location: "New York",
      rating: 4.8,
      description: "Reliable and fuel-efficient hybrid sedan perfect for city driving and long trips."
    },
    {
      id: 2,
      make: "BMW",
      model: "X3",
      year: 2024,
      type: "suv",
      seats: 5,
      transmission: "automatic",
      fuel: "gasoline",
      pricePerDay: 85,
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
      features: ["GPS", "Leather Seats", "Sunroof", "Premium Audio"],
      available: true,
      location: "Los Angeles",
      rating: 4.9,
      description: "Luxury SUV with premium features and exceptional performance."
    },
    {
      id: 3,
      make: "Tesla",
      model: "Model 3",
      year: 2024,
      type: "sedan",
      seats: 5,
      transmission: "automatic",
      fuel: "electric",
      pricePerDay: 70,
      image: "https://images.wsj.net/im-940070?width=700&height=467",
      features: ["Autopilot", "Premium Connectivity", "Glass Roof", "Supercharging"],
      available: true,
      location: "San Francisco",
      rating: 4.7,
      description: "Revolutionary electric sedan with cutting-edge technology and autopilot features."
    },
    {
      id: 4,
      make: "Honda",
      model: "Civic",
      year: 2023,
      type: "compact",
      seats: 5,
      transmission: "manual",
      fuel: "gasoline",
      pricePerDay: 35,
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400",
      features: ["GPS", "Bluetooth", "AC"],
      available: true,
      location: "Chicago",
      rating: 4.5,
      description: "Compact and economical car ideal for city driving and fuel efficiency."
    },
    {
      id: 5,
      make: "Ford",
      model: "Mustang",
      year: 2024,
      type: "sports",
      seats: 4,
      transmission: "automatic",
      fuel: "gasoline",
      pricePerDay: 95,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmGcoEahGjkPEJzdUiIPPgOYCM84_pC1C10Q&s",
      features: ["Performance Package", "Premium Audio", "Sport Suspension"],
      available: true,
      location: "Miami",
      rating: 4.6,
      description: "Iconic American muscle car with powerful performance and classic styling."
    },
    {
      id: 6,
      make: "Volkswagen",
      model: "Atlas",
      year: 2024,
      type: "suv",
      seats: 7,
      transmission: "automatic",
      fuel: "gasoline",
      pricePerDay: 75,
      image: "data:image/jpeg;base64,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",
      features: ["3rd Row Seating", "GPS", "Bluetooth", "Apple CarPlay"],
      available: true,
      location: "Denver",
      rating: 4.4,
      description: "Spacious 7-seater SUV perfect for family trips and group travel."
    }
  ],
  users: [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "customer",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      phone: "+1-555-0123",
      address: "123 Main St, New York, NY 10001"
    },
    {
      id: 2,
      name: "Admin User",
      email: "admin@carental.com",
      role: "admin",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      phone: "+1-555-0100",
      address: "456 Admin Ave, Los Angeles, CA 90001"
    }
  ],
  bookings: [
    {
      id: 1,
      userId: 1,
      carId: 1,
      startDate: "2024-03-15",
      endDate: "2024-03-20",
      totalAmount: 225,
      status: "confirmed",
      paymentId: "pay_1234567890",
      createdAt: "2024-03-01T10:00:00Z"
    }
  ],
  locations: ["New York", "Los Angeles", "San Francisco", "Chicago", "Miami", "Denver"],
  carTypes: ["compact", "sedan", "suv", "sports", "luxury", "electric"],
  testimonials: [
    {
      id: 1,
      name: "Michael Johnson",
      rating: 5,
      comment: "Amazing service! The car was in perfect condition and the booking process was seamless.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100"
    },
    {
      id: 2,
      name: "Sarah Williams",
      rating: 5,
      comment: "Great experience from start to finish. Highly recommend for anyone looking to rent a car.",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100"
    }
  ]
};

// Global state management
let globalState = {
  currentUser: null,
  currentPage: 'home',
  bookings: [...mockData.bookings],
  cars: [...mockData.cars]
};

// Context
const AppContext = createContext();

// Utility functions
const formatDate = (date) => new Date(date).toLocaleDateString();
const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 3600 * 24));
};

// Mock API
const mockApi = {
  login: (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockData.users.find(u => u.email === email);
        if (user && password) {
          resolve({ user, token: btoa(JSON.stringify({userId: user.id, role: user.role})) });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  },
  
  register: (userData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: mockData.users.length + 1,
          ...userData,
          role: 'customer',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
        };
        mockData.users.push(newUser);
        resolve({ user: newUser, token: btoa(JSON.stringify({userId: newUser.id, role: newUser.role})) });
      }, 1000);
    });
  },
  
  getCars: (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredCars = [...mockData.cars];
        if (filters.location) {
          filteredCars = filteredCars.filter(car => car.location === filters.location);
        }
        if (filters.type) {
          filteredCars = filteredCars.filter(car => car.type === filters.type);
        }
        resolve(filteredCars);
      }, 500);
    });
  },
  
  createBooking: (bookingData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newBooking = {
          id: mockData.bookings.length + 1,
          ...bookingData,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        mockData.bookings.push(newBooking);
        globalState.bookings.push(newBooking);
        resolve(newBooking);
      }, 1000);
    });
  },
  
  processPayment: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ paymentId: 'pay_' + Math.random().toString(36).substr(2, 9), status: 'success' });
      }, 2000);
    });
  }
};

// Components

const Header = ({ currentUser, currentPage, onNavigate, onLogin, onLogout }) => {
  return React.createElement('header', { className: 'header' },
    React.createElement('nav', { className: 'nav' },
      React.createElement('a', { 
        href: '#', 
        className: 'logo',
        onClick: (e) => { e.preventDefault(); onNavigate('home'); }
      }, 'CarRental Pro'),
      React.createElement('div', { className: 'nav-links' },
        React.createElement('a', { 
          href: '#', 
          className: `nav-link ${currentPage === 'home' ? 'active' : ''}`,
          onClick: (e) => { e.preventDefault(); onNavigate('home'); }
        }, 'Home'),
        React.createElement('a', { 
          href: '#', 
          className: `nav-link ${currentPage === 'cars' ? 'active' : ''}`,
          onClick: (e) => { e.preventDefault(); onNavigate('cars'); }
        }, 'Cars'),
        currentUser && React.createElement('a', { 
          href: '#', 
          className: `nav-link ${currentPage === 'bookings' ? 'active' : ''}`,
          onClick: (e) => { e.preventDefault(); onNavigate('bookings'); }
        }, 'My Bookings'),
        currentUser && currentUser.role === 'admin' && React.createElement('a', { 
          href: '#', 
          className: `nav-link ${currentPage === 'admin' ? 'active' : ''}`,
          onClick: (e) => { e.preventDefault(); onNavigate('admin'); }
        }, 'Admin')
      ),
      React.createElement('div', { className: 'user-menu' },
        currentUser ? [
          React.createElement('img', { 
            key: 'avatar',
            src: currentUser.profileImage, 
            alt: currentUser.name,
            className: 'user-avatar'
          }),
          React.createElement('span', { key: 'name' }, `Welcome, ${currentUser.name}`),
          React.createElement('button', { 
            key: 'logout',
            className: 'btn btn--sm btn--outline',
            onClick: onLogout
          }, 'Logout')
        ] : [
          React.createElement('button', { 
            key: 'login',
            className: 'btn btn--sm btn--outline',
            onClick: () => onNavigate('login')
          }, 'Login'),
          React.createElement('button', { 
            key: 'register',
            className: 'btn btn--sm btn--primary',
            onClick: () => onNavigate('register')
          }, 'Register')
        ]
      )
    )
  );
};

const CarCard = ({ car, onBookNow }) => {
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(React.createElement('i', { key: i, className: 'fas fa-star' }));
    }
    return stars;
  };

  return React.createElement('div', { className: 'car-card' },
    React.createElement('img', { 
      src: car.image, 
      alt: `${car.make} ${car.model}`, 
      className: 'car-image' 
    }),
    React.createElement('div', { className: 'car-info' },
      React.createElement('h3', { className: 'car-title' }, `${car.make} ${car.model} ${car.year}`),
      React.createElement('div', { className: 'rating' },
        React.createElement('span', { className: 'stars' }, ...renderStars(car.rating)),
        React.createElement('span', null, `(${car.rating})`)
      ),
      React.createElement('div', { className: 'car-specs' },
        React.createElement('span', { className: 'car-spec' },
          React.createElement('i', { className: 'fas fa-users' }), ` ${car.seats} seats`
        ),
        React.createElement('span', { className: 'car-spec' },
          React.createElement('i', { className: 'fas fa-cog' }), ` ${car.transmission}`
        ),
        React.createElement('span', { className: 'car-spec' },
          React.createElement('i', { className: 'fas fa-gas-pump' }), ` ${car.fuel}`
        ),
        React.createElement('span', { className: 'car-spec' },
          React.createElement('i', { className: 'fas fa-map-marker-alt' }), ` ${car.location}`
        )
      ),
      React.createElement('div', { className: 'car-features' },
        ...car.features.slice(0, 3).map((feature, index) =>
          React.createElement('span', { key: index, className: 'car-feature' },
            React.createElement('i', { className: 'fas fa-check' }), ` ${feature}`
          )
        )
      ),
      React.createElement('div', { className: 'car-price' }, `$${car.pricePerDay}/day`),
      React.createElement('div', { className: 'action-buttons' },
        React.createElement('button', { 
          className: 'btn btn--primary btn--sm',
          onClick: () => onBookNow(car)
        }, 'Book Now')
      )
    )
  );
};

const SearchForm = ({ onSearch }) => {
  const [filters, setFilters] = useState({
    location: '',
    startDate: '',
    endDate: '',
    carType: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return React.createElement('form', { className: 'search-form', onSubmit: handleSubmit },
    React.createElement('div', { className: 'search-grid' },
      React.createElement('div', { className: 'search-field' },
        React.createElement('label', null, 'Pickup Location'),
        React.createElement('select', {
          name: 'location',
          className: 'form-control',
          value: filters.location,
          onChange: handleChange
        },
          React.createElement('option', { value: '' }, 'All Locations'),
          ...mockData.locations.map(location =>
            React.createElement('option', { key: location, value: location }, location)
          )
        )
      ),
      React.createElement('div', { className: 'search-field' },
        React.createElement('label', null, 'Pickup Date'),
        React.createElement('input', {
          type: 'date',
          name: 'startDate',
          className: 'form-control',
          value: filters.startDate,
          onChange: handleChange,
          min: new Date().toISOString().split('T')[0]
        })
      ),
      React.createElement('div', { className: 'search-field' },
        React.createElement('label', null, 'Return Date'),
        React.createElement('input', {
          type: 'date',
          name: 'endDate',
          className: 'form-control',
          value: filters.endDate,
          onChange: handleChange,
          min: filters.startDate || new Date().toISOString().split('T')[0]
        })
      ),
      React.createElement('div', { className: 'search-field' },
        React.createElement('label', null, 'Car Type'),
        React.createElement('select', {
          name: 'carType',
          className: 'form-control',
          value: filters.carType,
          onChange: handleChange
        },
          React.createElement('option', { value: '' }, 'All Types'),
          ...mockData.carTypes.map(type =>
            React.createElement('option', { key: type, value: type }, 
              type.charAt(0).toUpperCase() + type.slice(1)
            )
          )
        )
      )
    ),
    React.createElement('button', { 
      type: 'submit', 
      className: 'btn btn--primary btn--full-width'
    },
      React.createElement('i', { className: 'fas fa-search' }), ' Search Cars'
    )
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return React.createElement('div', { 
    className: 'modal', 
    onClick: onClose 
  },
    React.createElement('div', { 
      className: 'modal-content', 
      onClick: e => e.stopPropagation() 
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', { className: 'modal-title' }, title),
        React.createElement('button', { 
          className: 'modal-close', 
          onClick: onClose 
        },
          React.createElement('i', { className: 'fas fa-times' })
        )
      ),
      React.createElement('div', { className: 'modal-body' }, children)
    )
  );
};

const BookingForm = ({ car, onBook, onCancel }) => {
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => {
      const updated = { ...prev, [name]: value };
      if (updated.startDate && updated.endDate) {
        const days = calculateDays(updated.startDate, updated.endDate);
        updated.totalAmount = days * car.pricePerDay;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const booking = await mockApi.createBooking({
        userId: globalState.currentUser.id,
        carId: car.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalAmount: bookingData.totalAmount
      });
      onBook(booking);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const days = bookingData.startDate && bookingData.endDate ? 
    calculateDays(bookingData.startDate, bookingData.endDate) : 0;

  return React.createElement('form', { className: 'booking-form', onSubmit: handleSubmit },
    React.createElement('h3', null, `Book ${car.make} ${car.model}`),
    React.createElement('div', { className: 'form-group' },
      React.createElement('label', { className: 'form-label' }, 'Pickup Date'),
      React.createElement('input', {
        type: 'date',
        name: 'startDate',
        className: 'form-control',
        value: bookingData.startDate,
        onChange: handleChange,
        min: new Date().toISOString().split('T')[0],
        required: true
      })
    ),
    React.createElement('div', { className: 'form-group' },
      React.createElement('label', { className: 'form-label' }, 'Return Date'),
      React.createElement('input', {
        type: 'date',
        name: 'endDate',
        className: 'form-control',
        value: bookingData.endDate,
        onChange: handleChange,
        min: bookingData.startDate || new Date().toISOString().split('T')[0],
        required: true
      })
    ),
    days > 0 && React.createElement('div', { className: 'booking-summary' },
      React.createElement('div', null, `Rental Days: ${days}`),
      React.createElement('div', null, `Price per Day: $${car.pricePerDay}`),
      React.createElement('div', { className: 'booking-total' }, `Total: $${bookingData.totalAmount}`)
    ),
    React.createElement('div', { className: 'action-buttons' },
      React.createElement('button', { 
        type: 'button', 
        className: 'btn btn--outline', 
        onClick: onCancel,
        disabled: loading
      }, 'Cancel'),
      React.createElement('button', { 
        type: 'submit', 
        className: 'btn btn--primary',
        disabled: loading || days <= 0
      }, loading ? 'Processing...' : 'Proceed to Payment')
    )
  );
};

const PaymentForm = ({ booking, car, onPaymentSuccess, onCancel }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await mockApi.processPayment();
      onPaymentSuccess();
    } catch (err) {
      console.error('Payment failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPaymentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return React.createElement('form', { className: 'payment-form', onSubmit: handleSubmit },
    React.createElement('h3', null, 'Complete Your Payment'),
    React.createElement('div', { className: 'payment-summary' },
      React.createElement('h4', null, `${car.make} ${car.model}`),
      React.createElement('p', null, `Pickup: ${formatDate(booking.startDate)}`),
      React.createElement('p', null, `Return: ${formatDate(booking.endDate)}`),
      React.createElement('p', null, `Days: ${calculateDays(booking.startDate, booking.endDate)}`),
      React.createElement('p', null,
        React.createElement('strong', null, `Total Amount: $${booking.totalAmount}`)
      )
    ),
    React.createElement('div', { className: 'form-group' },
      React.createElement('label', { className: 'form-label' }, 'Cardholder Name'),
      React.createElement('input', {
        type: 'text',
        name: 'cardholderName',
        className: 'form-control',
        value: paymentData.cardholderName,
        onChange: handleChange,
        placeholder: 'John Doe',
        required: true
      })
    ),
    React.createElement('div', { className: 'form-group' },
      React.createElement('label', { className: 'form-label' }, 'Card Number'),
      React.createElement('input', {
        type: 'text',
        name: 'cardNumber',
        className: 'form-control card-input',
        value: paymentData.cardNumber,
        onChange: handleChange,
        placeholder: '4242 4242 4242 4242',
        maxLength: 19,
        required: true
      })
    ),
    React.createElement('div', { 
      style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-16)' }
    },
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Expiry Month'),
        React.createElement('select', {
          name: 'expiryMonth',
          className: 'form-control',
          value: paymentData.expiryMonth,
          onChange: handleChange,
          required: true
        },
          React.createElement('option', { value: '' }, 'Month'),
          ...Array.from({length: 12}, (_, i) => 
            React.createElement('option', { key: i + 1, value: i + 1 }, 
              String(i + 1).padStart(2, '0')
            )
          )
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'Expiry Year'),
        React.createElement('select', {
          name: 'expiryYear',
          className: 'form-control',
          value: paymentData.expiryYear,
          onChange: handleChange,
          required: true
        },
          React.createElement('option', { value: '' }, 'Year'),
          ...Array.from({length: 10}, (_, i) => {
            const year = new Date().getFullYear() + i;
            return React.createElement('option', { key: year, value: year }, year);
          })
        )
      ),
      React.createElement('div', { className: 'form-group' },
        React.createElement('label', { className: 'form-label' }, 'CVV'),
        React.createElement('input', {
          type: 'text',
          name: 'cvv',
          className: 'form-control',
          value: paymentData.cvv,
          onChange: handleChange,
          placeholder: '123',
          maxLength: 4,
          required: true
        })
      )
    ),
    React.createElement('div', { className: 'action-buttons' },
      React.createElement('button', { 
        type: 'button', 
        className: 'btn btn--outline', 
        onClick: onCancel,
        disabled: loading
      }, 'Cancel'),
      React.createElement('button', { 
        type: 'submit', 
        className: 'btn btn--primary',
        disabled: loading
      }, loading ? 'Processing Payment...' : `Pay $${booking.totalAmount}`)
    )
  );
};

// Pages
const HomePage = ({ onNavigate }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeaturedCars();
  }, []);

  const loadFeaturedCars = async () => {
    setLoading(true);
    try {
      const allCars = await mockApi.getCars();
      setCars(allCars.slice(0, 3));
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    onNavigate('cars');
  };

  const handleBookCar = () => {
    if (!globalState.currentUser) {
      onNavigate('login');
    } else {
      onNavigate('cars');
    }
  };

  return React.createElement('div', { className: 'main-content' },
    React.createElement('section', { className: 'hero' },
      React.createElement('div', { className: 'container' },
        React.createElement('div', { className: 'hero-content' },
          React.createElement('h1', null, 'Find Your Perfect Rental Car'),
          React.createElement('p', null, 'Choose from our wide selection of premium vehicles for your next adventure. Book with confidence and drive with style.'),
          React.createElement(SearchForm, { onSearch: handleSearch })
        )
      )
    ),
    React.createElement('section', { 
      className: 'container', 
      style: { padding: 'var(--space-32) var(--space-16)' }
    },
      React.createElement('h2', { 
        className: 'text-center', 
        style: { marginBottom: 'var(--space-32)' }
      }, 'Featured Cars'),
      loading ? 
        React.createElement('div', { className: 'loading' },
          React.createElement('span', { className: 'spinner' }),
          'Loading featured cars...'
        ) :
        React.createElement('div', { className: 'cars-grid' },
          ...cars.map(car => 
            React.createElement(CarCard, { 
              key: car.id, 
              car: car,
              onBookNow: handleBookCar
            })
          )
        ),
      React.createElement('div', { className: 'text-center mt-16' },
        React.createElement('button', { 
          className: 'btn btn--primary btn--lg',
          onClick: () => onNavigate('cars')
        }, 'View All Cars')
      )
    ),
    React.createElement('section', { className: 'testimonials' },
      React.createElement('div', { className: 'container' },
        React.createElement('h2', { className: 'text-center' }, 'What Our Customers Say'),
        React.createElement('div', { className: 'testimonials-grid' },
          ...mockData.testimonials.map(testimonial =>
            React.createElement('div', { key: testimonial.id, className: 'testimonial' },
              React.createElement('div', { className: 'testimonial-content' }, 
                `"${testimonial.comment}"`
              ),
              React.createElement('div', { className: 'testimonial-author' },
                React.createElement('img', { 
                  src: testimonial.image, 
                  alt: testimonial.name, 
                  className: 'testimonial-avatar' 
                }),
                React.createElement('div', null,
                  React.createElement('div', { className: 'testimonial-name' }, testimonial.name),
                  React.createElement('div', { className: 'stars' },
                    ...Array.from({length: testimonial.rating}, (_, i) => 
                      React.createElement('i', { key: i, className: 'fas fa-star' })
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

const CarsPage = ({ onNavigate }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    setLoading(true);
    try {
      const allCars = await mockApi.getCars();
      setCars(allCars);
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookCar = (car) => {
    if (!globalState.currentUser) {
      onNavigate('login');
      return;
    }
    setSelectedCar(car);
    setShowBookingModal(true);
  };

  const handleBookingComplete = (booking) => {
    setCurrentBooking(booking);
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setCurrentBooking(null);
    setSelectedCar(null);
    alert('Booking confirmed! You will receive a confirmation email shortly.');
  };

  const closeModals = () => {
    setShowBookingModal(false);
    setShowPaymentModal(false);
    setCurrentBooking(null);
    setSelectedCar(null);
  };

  return React.createElement('div', { className: 'main-content' },
    React.createElement('div', { 
      className: 'container', 
      style: { padding: 'var(--space-32) var(--space-16)' }
    },
      React.createElement('h1', null, 'Available Cars'),
      loading ? 
        React.createElement('div', { className: 'loading' },
          React.createElement('span', { className: 'spinner' }),
          'Loading cars...'
        ) :
        React.createElement('div', { className: 'cars-grid' },
          ...cars.map(car => 
            React.createElement(CarCard, { 
              key: car.id, 
              car: car,
              onBookNow: handleBookCar
            })
          )
        )
    ),
    React.createElement(Modal, { 
      isOpen: showBookingModal, 
      onClose: closeModals,
      title: 'Book Your Car'
    },
      selectedCar && React.createElement(BookingForm, { 
        car: selectedCar,
        onBook: handleBookingComplete,
        onCancel: closeModals
      })
    ),
    React.createElement(Modal, { 
      isOpen: showPaymentModal, 
      onClose: closeModals,
      title: 'Complete Payment'
    },
      currentBooking && selectedCar && React.createElement(PaymentForm, { 
        booking: currentBooking,
        car: selectedCar,
        onPaymentSuccess: handlePaymentSuccess,
        onCancel: closeModals
      })
    )
  );
};

const LoginPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await mockApi.login(formData.email, formData.password);
      globalState.currentUser = result.user;
      localStorage.setItem('authToken', result.token);
      onNavigate('home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return React.createElement('div', { className: 'main-content' },
    React.createElement('div', { className: 'container' },
      React.createElement('form', { className: 'form', onSubmit: handleSubmit },
        React.createElement('h2', { className: 'form-title' }, 'Login to Your Account'),
        error && React.createElement('div', { className: 'form-error' },
          React.createElement('i', { className: 'fas fa-exclamation-triangle' }), ` ${error}`
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            name: 'email',
            className: 'form-control',
            value: formData.email,
            onChange: handleChange,
            placeholder: 'Enter your email',
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Password'),
          React.createElement('input', {
            type: 'password',
            name: 'password',
            className: 'form-control',
            value: formData.password,
            onChange: handleChange,
            placeholder: 'Enter your password',
            required: true
          })
        ),
        React.createElement('button', { 
          type: 'submit', 
          className: 'btn btn--primary btn--full-width',
          disabled: loading
        }, loading ? 'Logging in...' : 'Login'),
        React.createElement('div', { className: 'text-center mt-16' },
          React.createElement('p', null,
            "Don't have an account? ",
            React.createElement('a', { 
              href: '#', 
              onClick: (e) => { e.preventDefault(); onNavigate('register'); }
            }, 'Register here')
          )
        ),
        React.createElement('div', { className: 'text-center mt-16' },
          React.createElement('small', { style: { color: 'var(--color-text-secondary)' } },
            'Demo credentials:',
            React.createElement('br'),
            'Customer: john@example.com / password',
            React.createElement('br'),
            'Admin: admin@carental.com / password'
          )
        )
      )
    )
  );
};

const RegisterPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await mockApi.register(formData);
      globalState.currentUser = result.user;
      localStorage.setItem('authToken', result.token);
      onNavigate('home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return React.createElement('div', { className: 'main-content' },
    React.createElement('div', { className: 'container' },
      React.createElement('form', { className: 'form', onSubmit: handleSubmit },
        React.createElement('h2', { className: 'form-title' }, 'Create Your Account'),
        error && React.createElement('div', { className: 'form-error' },
          React.createElement('i', { className: 'fas fa-exclamation-triangle' }), ` ${error}`
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Full Name'),
          React.createElement('input', {
            type: 'text',
            name: 'name',
            className: 'form-control',
            value: formData.name,
            onChange: handleChange,
            placeholder: 'Enter your full name',
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            name: 'email',
            className: 'form-control',
            value: formData.email,
            onChange: handleChange,
            placeholder: 'Enter your email',
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Password'),
          React.createElement('input', {
            type: 'password',
            name: 'password',
            className: 'form-control',
            value: formData.password,
            onChange: handleChange,
            placeholder: 'Enter your password',
            required: true
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Phone Number'),
          React.createElement('input', {
            type: 'tel',
            name: 'phone',
            className: 'form-control',
            value: formData.phone,
            onChange: handleChange,
            placeholder: 'Enter your phone number'
          })
        ),
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Address'),
          React.createElement('textarea', {
            name: 'address',
            className: 'form-control',
            value: formData.address,
            onChange: handleChange,
            placeholder: 'Enter your address',
            rows: 3
          })
        ),
        React.createElement('button', { 
          type: 'submit', 
          className: 'btn btn--primary btn--full-width',
          disabled: loading
        }, loading ? 'Creating Account...' : 'Create Account'),
        React.createElement('div', { className: 'text-center mt-16' },
          React.createElement('p', null,
            'Already have an account? ',
            React.createElement('a', { 
              href: '#', 
              onClick: (e) => { e.preventDefault(); onNavigate('login'); }
            }, 'Login here')
          )
        )
      )
    )
  );
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (globalState.currentUser) {
      const userBookings = globalState.bookings.filter(b => b.userId === globalState.currentUser.id);
      setBookings(userBookings);
    }
    setLoading(false);
  }, []);

  if (!globalState.currentUser) {
    return React.createElement('div', { className: 'main-content' },
      React.createElement('div', { 
        className: 'container text-center', 
        style: { padding: 'var(--space-32)' }
      },
        React.createElement('p', null, 'Please login to view your bookings.')
      )
    );
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status--warning',
      confirmed: 'status--success',
      cancelled: 'status--error'
    };
    
    return React.createElement('span', { 
      className: `status ${statusClasses[status] || 'status--info'}` 
    }, status.charAt(0).toUpperCase() + status.slice(1));
  };

  return React.createElement('div', { className: 'main-content' },
    React.createElement('div', { 
      className: 'container', 
      style: { padding: 'var(--space-32) var(--space-16)' }
    },
      React.createElement('h1', null, 'My Bookings'),
      loading ? 
        React.createElement('div', { className: 'loading' },
          React.createElement('span', { className: 'spinner' }),
          'Loading bookings...'
        ) :
        bookings.length === 0 ? 
          React.createElement('div', { className: 'empty-state' },
            React.createElement('i', { 
              className: 'fas fa-calendar',
              style: { 
                fontSize: '48px', 
                marginBottom: 'var(--space-16)', 
                color: 'var(--color-text-secondary)' 
              }
            }),
            React.createElement('p', null, "You don't have any bookings yet.")
          ) :
          React.createElement('div', { className: 'table-container' },
            React.createElement('table', { className: 'table' },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', null, 'Car'),
                  React.createElement('th', null, 'Dates'),
                  React.createElement('th', null, 'Total'),
                  React.createElement('th', null, 'Status')
                )
              ),
              React.createElement('tbody', null,
                ...bookings.map(booking => {
                  const car = mockData.cars.find(c => c.id === booking.carId);
                  return React.createElement('tr', { key: booking.id },
                    React.createElement('td', null,
                      car && React.createElement('div', null,
                        React.createElement('strong', null, `${car.make} ${car.model}`),
                        React.createElement('br'),
                        React.createElement('small', null, car.year)
                      )
                    ),
                    React.createElement('td', null,
                      React.createElement('div', null,
                        React.createElement('strong', null, 'Pickup: '), formatDate(booking.startDate),
                        React.createElement('br'),
                        React.createElement('strong', null, 'Return: '), formatDate(booking.endDate)
                      )
                    ),
                    React.createElement('td', null, `$${booking.totalAmount}`),
                    React.createElement('td', null, getStatusBadge(booking.status))
                  );
                })
              )
            )
          )
    )
  );
};

const Footer = () => React.createElement('footer', { className: 'footer' },
  React.createElement('div', { className: 'footer-content' },
    React.createElement('div', { className: 'footer-section' },
      React.createElement('h3', null, 'CarRental Pro'),
      React.createElement('p', null, 'Your trusted partner for premium car rental services. Drive with confidence, explore with style.')
    ),
    React.createElement('div', { className: 'footer-section' },
      React.createElement('h3', null, 'Contact Info'),
      React.createElement('p', null,
        React.createElement('i', { className: 'fas fa-phone' }), ' +1 (555) 123-4567'
      ),
      React.createElement('p', null,
        React.createElement('i', { className: 'fas fa-envelope' }), ' info@carrentalpro.com'
      )
    )
  )
);

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = JSON.parse(atob(token));
        const user = mockData.users.find(u => u.id === userData.userId);
        if (user) {
          globalState.currentUser = user;
        }
      } catch (err) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    globalState.currentUser = null;
    localStorage.removeItem('authToken');
    setCurrentPage('home');
    // Force re-render
    setLoading(true);
    setTimeout(() => setLoading(false), 0);
  };

  const renderPage = () => {
    if (loading) {
      return React.createElement('div', { 
        className: 'loading', 
        style: { height: '50vh' } 
      },
        React.createElement('span', { className: 'spinner' }),
        'Loading...'
      );
    }

    switch (currentPage) {
      case 'home':
        return React.createElement(HomePage, { onNavigate: handleNavigation });
      case 'cars':
        return React.createElement(CarsPage, { onNavigate: handleNavigation });
      case 'login':
        return React.createElement(LoginPage, { onNavigate: handleNavigation });
      case 'register':
        return React.createElement(RegisterPage, { onNavigate: handleNavigation });
      case 'bookings':
        return React.createElement(BookingsPage);
      default:
        return React.createElement(HomePage, { onNavigate: handleNavigation });
    }
  };

  return React.createElement('div', { className: 'app' },
    React.createElement(Header, {
      currentUser: globalState.currentUser,
      currentPage: currentPage,
      onNavigate: handleNavigation,
      onLogout: handleLogout
    }),
    renderPage(),
    React.createElement(Footer)
  );
};

// Initialize the application
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));