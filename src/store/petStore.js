import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROOMER_IMAGE_IDS = [
  '1587300003388-59208cc962cb',
  '1516734212722-37f1f5e86f2a',
  '1548199973-03cce0bbc87b',
  '1583511655826-05700d52f4d1',
  '1425082661705-1834bfd09dca',
  '1518717758536-85ae29035b6d',
  '1537151625747-768eb2767fd3',
  '1573865526182-10b0ba69b75b',
];

const TIME_SLOT_SETS = [
  ['Today 2:00 PM', 'Today 4:00 PM', 'Tomorrow 9:00 AM', 'Saturday 10:00 AM'],
  ['Today 3:00 PM', 'Today 5:30 PM', 'Tomorrow 11:00 AM', 'Saturday 1:00 PM'],
  ['Tomorrow 10:00 AM', 'Tomorrow 1:30 PM', 'Friday 4:00 PM', 'Sunday 9:30 AM'],
  ['Today 5:00 PM', 'Tomorrow 8:30 AM', 'Tomorrow 2:00 PM', 'Saturday 11:30 AM'],
  ['Tomorrow 9:00 AM', 'Tomorrow 12:30 PM', 'Friday 3:00 PM', 'Sunday 10:00 AM'],
  ['Today 3:00 PM', 'Tomorrow 10:30 AM', 'Saturday 12:00 PM', 'Sunday 2:00 PM'],
  ['Saturday 10:00 AM', 'Saturday 1:00 PM', 'Sunday 11:00 AM', 'Sunday 3:30 PM'],
  ['Tomorrow 2:00 PM', 'Friday 10:00 AM', 'Saturday 9:00 AM', 'Sunday 1:30 PM'],
];

const RAW_GROOMERS = [
  {
    id: 'g1',
    name: 'The Grooming Parlour',
    initial: 'G',
    suburb: 'Surry Hills',
    distance: 0.8,
    rating: 4.9,
    reviewCount: 312,
    priceFrom: 65,
    badge: 'Top Rated',
    badgeColor: '#14B8A6',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Today 2pm',
    services: [
      { name: 'Full Groom', price: 85, duration: '90min' },
      { name: 'Bath & Brush', price: 65, duration: '60min' },
      { name: 'Nail Trim', price: 20, duration: '15min' },
    ],
    reviews: [
      { name: 'Emma T.', stars: 5, text: 'Absolutely amazing! Buddy came home looking like a show dog.' },
      { name: 'James K.', stars: 5, text: 'So professional and gentle with my anxious cat.' },
    ],
    tags: ['Mobile available', 'Cats welcome', 'Senior pets'],
  },
  {
    id: 'g2',
    name: 'Fluffy Friends Grooming',
    initial: 'P',
    suburb: 'Newtown',
    distance: 1.2,
    rating: 4.8,
    reviewCount: 187,
    priceFrom: 55,
    badge: 'Popular',
    badgeColor: '#22C55E',
    petTypes: ['Dog'],
    nextAvailable: 'Today 4pm',
    services: [
      { name: 'Full Groom', price: 80, duration: '90min' },
      { name: 'Puppy Groom', price: 45, duration: '45min' },
      { name: 'De-shedding', price: 75, duration: '75min' },
    ],
    reviews: [
      { name: 'Sarah M.', stars: 5, text: 'Best groomer in Newtown, hands down!' },
      { name: 'Mike R.', stars: 4, text: 'Great service, my labrador loves coming here.' },
    ],
    tags: ['Large breeds', 'Walk-ins welcome'],
  },
  {
    id: 'g3',
    name: 'Paw Spa & Wellness',
    initial: 'S',
    suburb: 'Mosman',
    distance: 3.4,
    rating: 5,
    reviewCount: 98,
    priceFrom: 95,
    badge: 'Premium',
    badgeColor: '#0F766E',
    petTypes: ['Dog', 'Cat', 'Rabbit'],
    nextAvailable: 'Tomorrow 10am',
    services: [
      { name: 'Luxury Spa Groom', price: 130, duration: '120min' },
      { name: 'Full Groom', price: 95, duration: '90min' },
      { name: 'Aromatherapy Bath', price: 75, duration: '60min' },
    ],
    reviews: [
      { name: 'Victoria B.', stars: 5, text: 'Worth every cent. My poodle has never looked better!' },
      { name: 'Leo C.', stars: 5, text: 'Calm, premium and worth it for nervous rabbits too.' },
    ],
    tags: ['Luxury', 'Anxiety-free', 'Organic products'],
  },
  {
    id: 'g4',
    name: "Buddy's Barber Shop",
    initial: 'F',
    suburb: 'Glebe',
    distance: 1.8,
    rating: 4.7,
    reviewCount: 234,
    priceFrom: 50,
    badge: null,
    badgeColor: null,
    petTypes: ['Dog'],
    nextAvailable: 'Today 5pm',
    services: [
      { name: 'Full Groom', price: 70, duration: '75min' },
      { name: 'Bath & Dry', price: 50, duration: '50min' },
      { name: 'Tidy Up', price: 35, duration: '30min' },
    ],
    reviews: [
      { name: 'Pete H.', stars: 5, text: 'Fast, affordable, great with my staffie!' },
      { name: 'Lisa W.', stars: 4, text: 'Very friendly and efficient.' },
    ],
    tags: ['Affordable', 'Quick appointments'],
  },
  {
    id: 'g5',
    name: 'Mobile Paws',
    initial: 'M',
    suburb: 'MOBILE — Comes to you',
    distance: 0,
    rating: 4.9,
    reviewCount: 445,
    priceFrom: 90,
    badge: 'Mobile',
    badgeColor: '#10B981',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Tomorrow 9am',
    services: [
      { name: 'Mobile Full Groom', price: 110, duration: '90min' },
      { name: 'Mobile Bath & Brush', price: 90, duration: '60min' },
    ],
    reviews: [
      { name: 'Rachel C.', stars: 5, text: 'Comes to my door! My dog is so much less stressed.' },
      { name: 'Tom B.', stars: 5, text: 'Game changer. Never going to a salon again.' },
    ],
    tags: ['Mobile', 'Stress-free', 'No travel needed'],
  },
  {
    id: 'g6',
    name: 'Cat & Dog Spa',
    initial: 'W',
    suburb: 'Paddington',
    distance: 2.1,
    rating: 4.8,
    reviewCount: 156,
    priceFrom: 70,
    badge: 'Cat Specialist',
    badgeColor: '#34D399',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Today 3pm',
    services: [
      { name: 'Cat Full Groom', price: 90, duration: '90min' },
      { name: 'Dog Full Groom', price: 80, duration: '80min' },
      { name: 'Lion Cut (cats)', price: 110, duration: '120min' },
    ],
    reviews: [
      { name: 'Isla N.', stars: 5, text: 'Finally a cat groomer who understands spicy rescues.' },
      { name: 'Nina G.', stars: 4, text: 'Lovely team and very patient with our cavoodle too.' },
    ],
    tags: ['Cat specialist', 'Anxiety-free zone'],
  },
  {
    id: 'g7',
    name: 'Happy Hounds Grooming',
    initial: 'T',
    suburb: 'Marrickville',
    distance: 2.6,
    rating: 4.6,
    reviewCount: 203,
    priceFrom: 55,
    badge: null,
    badgeColor: null,
    petTypes: ['Dog'],
    nextAvailable: 'Sat 10am',
    services: [
      { name: 'Full Groom', price: 75, duration: '80min' },
      { name: 'Bath & Brush', price: 55, duration: '55min' },
    ],
    reviews: [
      { name: 'Cara F.', stars: 5, text: 'Reliable every single time and great weekend option.' },
      { name: 'Drew L.', stars: 4, text: 'Easy booking and fair pricing for medium breeds.' },
    ],
    tags: ['Family-run', 'Weekend appointments'],
  },
  {
    id: 'g8',
    name: 'Snip & Wag',
    initial: 'B',
    suburb: 'Leichhardt',
    distance: 2.9,
    rating: 4.7,
    reviewCount: 178,
    priceFrom: 60,
    badge: null,
    badgeColor: null,
    petTypes: ['Dog', 'Rabbit'],
    nextAvailable: 'Tomorrow 2pm',
    services: [
      { name: 'Full Groom', price: 78, duration: '80min' },
      { name: 'Small Pet Groom', price: 35, duration: '30min' },
    ],
    reviews: [
      { name: 'Ollie P.', stars: 5, text: 'They were wonderful with our rabbit and schnauzer.' },
      { name: 'Kylie J.', stars: 4, text: 'Friendly, efficient and great value.' },
    ],
    tags: ['Small animals', 'Gentle approach'],
  },
  {
    id: 'g9',
    name: 'Harbour Hounds Studio',
    initial: 'A',
    suburb: 'Balmain',
    distance: 3.1,
    rating: 4.8,
    reviewCount: 164,
    priceFrom: 72,
    badge: 'Harbour Pick',
    badgeColor: '#2DD4BF',
    petTypes: ['Dog'],
    nextAvailable: 'Tomorrow 11am',
    services: [
      { name: 'Clip & Style', price: 92, duration: '95min' },
      { name: 'Bath & Towel Dry', price: 72, duration: '55min' },
      { name: 'Nail & Paw Care', price: 28, duration: '20min' },
    ],
    reviews: [
      { name: 'Georgia W.', stars: 5, text: 'Perfect breed-specific clip every visit.' },
      { name: 'Sam E.', stars: 4, text: 'Super polished and easy to compare on Pawfect.' },
    ],
    tags: ['Designer cuts', 'Photo updates'],
  },
  {
    id: 'g10',
    name: 'Zen Tails Groom House',
    initial: 'B',
    suburb: 'Redfern',
    distance: 1.5,
    rating: 4.9,
    reviewCount: 221,
    priceFrom: 68,
    badge: 'Low Stress',
    badgeColor: '#059669',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Today 6pm',
    services: [
      { name: 'Calm Care Groom', price: 98, duration: '100min' },
      { name: 'Sensitive Skin Bath', price: 68, duration: '55min' },
      { name: 'Puppy Intro', price: 49, duration: '40min' },
    ],
    reviews: [
      { name: 'Hannah S.', stars: 5, text: 'My rescue finally relaxed during a groom.' },
      { name: 'Matt T.', stars: 5, text: 'The aftercare notes were excellent.' },
    ],
    tags: ['Fear-free', 'Sensitive skin'],
  },
  {
    id: 'g11',
    name: 'Inner West Pet Primp',
    initial: 'P',
    suburb: 'Annandale',
    distance: 2.2,
    rating: 4.5,
    reviewCount: 139,
    priceFrom: 48,
    badge: 'Budget Pick',
    badgeColor: '#6EE7B7',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Today 1pm',
    services: [
      { name: 'Mini Groom', price: 48, duration: '35min' },
      { name: 'Full Groom', price: 74, duration: '80min' },
      { name: 'Cat Brush Out', price: 52, duration: '35min' },
    ],
    reviews: [
      { name: 'Jess A.', stars: 4, text: 'Affordable and friendly for regular tidy-ups.' },
      { name: 'Paul D.', stars: 5, text: 'Great value without cutting corners.' },
    ],
    tags: ['Affordable', 'Repeat-customer deals'],
  },
  {
    id: 'g12',
    name: 'Dapper Dogs Co.',
    initial: 'D',
    suburb: 'Darlinghurst',
    distance: 1.9,
    rating: 4.8,
    reviewCount: 276,
    priceFrom: 69,
    badge: 'Most Reviewed',
    badgeColor: '#14B8A6',
    petTypes: ['Dog'],
    nextAvailable: 'Tomorrow 8am',
    services: [
      { name: 'Signature Style Groom', price: 96, duration: '95min' },
      { name: 'Bath & Blowout', price: 69, duration: '60min' },
      { name: 'Pawdicure', price: 24, duration: '20min' },
    ],
    reviews: [
      { name: 'Naomi R.', stars: 5, text: 'Stylish cuts and great communication.' },
      { name: 'Chris F.', stars: 4, text: 'Always on time and super clean salon.' },
    ],
    tags: ['Breed styling', 'CBD fringe'],
  },
  {
    id: 'g13',
    name: 'Whisker Wash Club',
    initial: 'B',
    suburb: 'Bondi',
    distance: 6.3,
    rating: 4.7,
    reviewCount: 129,
    priceFrom: 88,
    badge: 'Beachside',
    badgeColor: '#34D399',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Tomorrow 1pm',
    services: [
      { name: 'Beach Day De-shed', price: 102, duration: '90min' },
      { name: 'Wash & Brush', price: 88, duration: '60min' },
      { name: 'Cat Refresh', price: 92, duration: '75min' },
    ],
    reviews: [
      { name: 'Brie M.', stars: 5, text: 'Perfect after sandy beach adventures.' },
      { name: 'Ty K.', stars: 4, text: 'Convenient and polished.' },
    ],
    tags: ['De-shedding', 'Coastal pickup'],
  },
  {
    id: 'g14',
    name: 'Purr & Fluff Boutique',
    initial: 'K',
    suburb: 'Alexandria',
    distance: 3.8,
    rating: 4.9,
    reviewCount: 117,
    priceFrom: 76,
    badge: 'Cat Favourite',
    badgeColor: '#10B981',
    petTypes: ['Cat', 'Rabbit'],
    nextAvailable: 'Today 7pm',
    services: [
      { name: 'Cat Spa Session', price: 98, duration: '85min' },
      { name: 'Rabbit Groom', price: 76, duration: '50min' },
      { name: 'De-matting', price: 89, duration: '60min' },
    ],
    reviews: [
      { name: 'Ella P.', stars: 5, text: 'Our ragdoll came back silky and calm.' },
      { name: 'Mia V.', stars: 5, text: 'Fantastic rabbit handling too.' },
    ],
    tags: ['Cats only rooms', 'Quiet appointments'],
  },
  {
    id: 'g15',
    name: 'Rover Revival',
    initial: 'C',
    suburb: 'Waterloo',
    distance: 3.2,
    rating: 4.6,
    reviewCount: 191,
    priceFrom: 58,
    badge: null,
    badgeColor: null,
    petTypes: ['Dog'],
    nextAvailable: 'Today 12pm',
    services: [
      { name: 'Wash & Tidy', price: 58, duration: '45min' },
      { name: 'Full Groom', price: 79, duration: '80min' },
      { name: 'Flea Treatment Add-on', price: 22, duration: '15min' },
    ],
    reviews: [
      { name: 'Ben K.', stars: 5, text: 'Quick turnaround and my kelpie looked brilliant.' },
      { name: 'Tia H.', stars: 4, text: 'Easy to compare prices before booking.' },
    ],
    tags: ['Lunch break slots', 'Apartment dogs'],
  },
  {
    id: 'g16',
    name: 'North Shore Snips',
    initial: 'G',
    suburb: 'Neutral Bay',
    distance: 5.4,
    rating: 4.8,
    reviewCount: 208,
    priceFrom: 74,
    badge: 'Trusted Local',
    badgeColor: '#0F766E',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Tomorrow 3pm',
    services: [
      { name: 'Full Groom', price: 94, duration: '90min' },
      { name: 'Wash & Brush', price: 74, duration: '60min' },
      { name: 'Cat Hygiene Clip', price: 79, duration: '45min' },
    ],
    reviews: [
      { name: 'Nora S.', stars: 5, text: 'Professional and consistent every booking.' },
      { name: 'Ethan M.', stars: 4, text: 'Helpful team and a nice calm studio.' },
    ],
    tags: ['North shore', 'Parking nearby'],
  },
  {
    id: 'g17',
    name: 'Pocket Pet Pamper',
    initial: 'C',
    suburb: 'Camperdown',
    distance: 2.4,
    rating: 4.7,
    reviewCount: 88,
    priceFrom: 34,
    badge: 'Small Pets',
    badgeColor: '#22C55E',
    petTypes: ['Rabbit'],
    nextAvailable: 'Tomorrow 4pm',
    services: [
      { name: 'Rabbit Groom', price: 34, duration: '25min' },
      { name: 'Long Hair De-moult', price: 46, duration: '40min' },
      { name: 'Nail Clip', price: 16, duration: '10min' },
    ],
    reviews: [
      { name: 'Alicia C.', stars: 5, text: 'One of the few places that truly welcomes buns.' },
      { name: 'Rory J.', stars: 4, text: 'Gentle handling from start to finish.' },
    ],
    tags: ['Rabbit expert', 'Short visits'],
  },
  {
    id: 'g18',
    name: 'Urban Tailors Grooming',
    initial: 'S',
    suburb: 'CBD',
    distance: 2.7,
    rating: 4.8,
    reviewCount: 301,
    priceFrom: 82,
    badge: 'CBD Express',
    badgeColor: '#059669',
    petTypes: ['Dog'],
    nextAvailable: 'Today 4pm',
    services: [
      { name: 'Express City Groom', price: 82, duration: '55min' },
      { name: 'Corporate Puppy Wash', price: 59, duration: '35min' },
      { name: 'Style Cut', price: 97, duration: '90min' },
    ],
    reviews: [
      { name: 'Lachie W.', stars: 5, text: 'Perfect for dropping off before work.' },
      { name: 'Fiona B.', stars: 4, text: 'Busy but efficient and polished results.' },
    ],
    tags: ['Express', 'Office-hour friendly'],
  },
  {
    id: 'g19',
    name: 'Golden Paw Retreat',
    initial: 'S',
    suburb: 'Rose Bay',
    distance: 7.2,
    rating: 4.9,
    reviewCount: 154,
    priceFrom: 105,
    badge: 'Luxury Day Spa',
    badgeColor: '#34D399',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Sat 11am',
    services: [
      { name: 'Day Spa Groom', price: 145, duration: '140min' },
      { name: 'Signature Full Groom', price: 105, duration: '95min' },
      { name: 'Blueberry Facial', price: 32, duration: '20min' },
    ],
    reviews: [
      { name: 'Zoe H.', stars: 5, text: 'Resort treatment for spoiled pets.' },
      { name: 'Will T.', stars: 5, text: 'Five-star finish and lovely staff.' },
    ],
    tags: ['Luxury', 'Spa add-ons'],
  },
  {
    id: 'g20',
    name: 'Suburban Scrub Club',
    initial: 'C',
    suburb: 'Ashfield',
    distance: 5.9,
    rating: 4.5,
    reviewCount: 167,
    priceFrom: 52,
    badge: 'Value Choice',
    badgeColor: '#6EE7B7',
    petTypes: ['Dog', 'Cat'],
    nextAvailable: 'Tomorrow 5pm',
    services: [
      { name: 'Bath & Dry', price: 52, duration: '45min' },
      { name: 'Full Groom', price: 72, duration: '75min' },
      { name: 'Cat Brush & Tidy', price: 64, duration: '50min' },
    ],
    reviews: [
      { name: 'Kara N.', stars: 4, text: 'Straightforward, affordable and dependable.' },
      { name: 'Dean P.', stars: 5, text: 'Excellent value for two pets in one trip.' },
    ],
    tags: ['Budget-friendly', 'Multi-pet homes'],
  },
];

const PET_TYPE_OPTIONS = ['Dog', 'Cat', 'Rabbit'];
const PET_SIZE_OPTIONS = ['Small', 'Medium', 'Large'];
const INITIAL_BOOKING_DATA = {
  petName: '',
  petType: 'Dog',
  petSize: 'Small',
  time: '',
  notes: '',
  payment_amount_type: 'full',
};

function buildAbout(groomer) {
  const location = groomer.suburb.includes('Comes to you')
    ? 'a mobile experience that comes right to your door'
    : `a boutique studio in ${groomer.suburb}`;

  return `${groomer.name} offers ${location} for ${groomer.petTypes.join(', ').toLowerCase()} families. Pet parents love the ${groomer.tags.join(', ').toLowerCase()} experience, polished finishes, and calm handling from the first hello to the final fluff.`;
}

function buildBookingDefaults(groomer) {
  return {
    ...INITIAL_BOOKING_DATA,
    petType: groomer?.petTypes?.[0] || 'Dog',
    time: groomer?.timeSlots?.[0] || '',
  };
}

const GROOMERS = RAW_GROOMERS.map((groomer, index) => ({
  ...groomer,
  image: GROOMER_IMAGE_IDS[index % GROOMER_IMAGE_IDS.length],
  timeSlots: TIME_SLOT_SETS[index % TIME_SLOT_SETS.length],
  about: buildAbout(groomer),
}));

// Apply the same enrichment pipeline to API data so it is compatible with
// everything that consumes GROOMERS (image URIs, timeSlots, about text).
export function enrichGroomers(rawList) {
  return rawList.map((groomer, index) => ({
    ...groomer,
    image: groomer.photo || GROOMER_IMAGE_IDS[index % GROOMER_IMAGE_IDS.length],
    timeSlots: groomer.timeSlots || TIME_SLOT_SETS[index % TIME_SLOT_SETS.length],
    about: groomer.about || buildAbout(groomer),
  }));
}

const JWT_KEY = 'alphinium_auth_token';

const initState = {
  phase: 'login',
  authToken: null,
  authUser: null,
  isGuest: false,
  groomers: GROOMERS,
  groomersLoading: false,
  selectedGroomer: null,
  selectedService: null,
  filters: { petType: 'All', sortBy: 'Distance', priceMax: 'Any', available: 'Any' },
  searchText: '',
  bookingData: INITIAL_BOOKING_DATA,
  confirmedBooking: null,
};

function getFilteredGroomers(groomers, filters, search) {
  let list = [...groomers];

  if (filters.petType !== 'All') {
    list = list.filter((groomer) => groomer.petTypes.includes(filters.petType));
  }

  if (filters.priceMax !== 'Any') {
    const max = parseInt(filters.priceMax, 10);
    list = list.filter((groomer) => groomer.priceFrom <= max);
  }

  if (filters.available === 'Today') {
    list = list.filter((groomer) => groomer.nextAvailable.includes('Today'));
  }

  if (search) {
    const normalized = search.trim().toLowerCase();
    list = list.filter(
      (groomer) =>
        groomer.name.toLowerCase().includes(normalized) ||
        groomer.suburb.toLowerCase().includes(normalized) ||
        groomer.tags.join(' ').toLowerCase().includes(normalized) ||
        groomer.services.some((service) => service.name.toLowerCase().includes(normalized))
    );
  }

  if (filters.sortBy === 'Distance') {
    list.sort((a, b) => a.distance - b.distance);
  }
  if (filters.sortBy === 'Rating') {
    list.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }
  if (filters.sortBy === 'Price') {
    list.sort((a, b) => a.priceFrom - b.priceFrom);
  }

  return list;
}

function getGroomerById(id, groomers = GROOMERS) {
  return groomers.find((groomer) => groomer.id === id) || null;
}

function getGroomerImageUri(imageId, width = 800, quality = 80) {
  return `https://images.unsplash.com/photo-${imageId}?w=${width}&q=${quality}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_LOGIN':
      return {
        ...state,
        phase: 'home',
        authToken: action.guest ? null : action.token ?? null,
        authUser: action.guest ? null : action.user ?? null,
        isGuest: Boolean(action.guest),
        selectedGroomer: null,
        selectedService: null,
        confirmedBooking: null,
      };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'SELECT_GROOMER': {
      const groomer = getGroomerById(action.id, state.groomers);
      return {
        ...state,
        selectedGroomer: action.id,
        selectedService: groomer ? { ...groomer.services[0], groomerId: groomer.id } : null,
        bookingData: buildBookingDefaults(groomer),
        phase: action.phase || 'groomer',
      };
    }
    case 'SELECT_SERVICE':
      return {
        ...state,
        selectedService: action.service,
      };
    case 'SELECT_TIME_SLOT':
      return {
        ...state,
        bookingData: { ...state.bookingData, time: action.time },
      };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.val },
      };
    case 'SET_SEARCH':
      return { ...state, searchText: action.val };
    case 'SET_BOOKING_DATA':
      return {
        ...state,
        bookingData: { ...state.bookingData, [action.key]: action.val },
      };
    case 'START_BOOKING': {
      const groomer = getGroomerById(state.selectedGroomer, state.groomers);
      return {
        ...state,
        phase: 'booking',
        selectedService:
          action.service || state.selectedService || (groomer ? { ...groomer.services[0], groomerId: groomer.id } : null),
        bookingData: {
          ...state.bookingData,
          time: action.time || state.bookingData.time || groomer?.timeSlots?.[0] || '',
        },
      };
    }
    case 'COMPLETE_BOOKING': {
      const groomer = getGroomerById(state.selectedGroomer, state.groomers);
      return {
        ...state,
        phase: 'confirm',
        confirmedBooking: {
          groomer,
          service: state.selectedService,
          bookingData: state.bookingData,
          booking_id: null,
          confirmation_code: null,
          payment_status: null,
          payment_amount: null,
          currency: 'aud',
        },
      };
    }
    case 'SET_BOOKING_RESULT':
      return {
        ...state,
        confirmedBooking: state.confirmedBooking
          ? {
              ...state.confirmedBooking,
              booking_id: action.booking_id ?? null,
              confirmation_code: action.confirmation_code ?? null,
            }
          : state.confirmedBooking,
      };
    case 'SET_PAYMENT_RESULT':
      return {
        ...state,
        confirmedBooking: state.confirmedBooking
          ? {
              ...state.confirmedBooking,
              payment_status: action.payment_status ?? null,
              payment_amount: action.payment_amount ?? null,
              currency: action.currency ?? 'aud',
            }
          : state.confirmedBooking,
      };
    case 'RESET_BOOKING':
      return {
        ...state,
        phase: 'home',
        selectedGroomer: null,
        selectedService: null,
        bookingData: INITIAL_BOOKING_DATA,
        confirmedBooking: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        phase: 'login',
        authToken: null,
        authUser: null,
        isGuest: false,
        selectedGroomer: null,
        selectedService: null,
        bookingData: INITIAL_BOOKING_DATA,
        confirmedBooking: null,
      };
    case 'GROOMERS_LOADING':
      return { ...state, groomersLoading: action.loading };
    case 'SET_GROOMERS':
      return { ...state, groomers: action.groomers, groomersLoading: false };
    default:
      return state;
  }
}

const PetContext = createContext(null);

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within PetProvider');
  }
  return context;
};

export {
  GROOMERS,
  PET_SIZE_OPTIONS,
  PET_TYPE_OPTIONS,
  getFilteredGroomers,
  getGroomerById,
  getGroomerImageUri,
};

export function PetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initState);
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(JWT_KEY);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, [dispatch]);
  const value = useMemo(() => ({ state, dispatch, logout }), [logout, state]);
  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}
