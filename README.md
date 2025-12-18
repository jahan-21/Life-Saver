# LifeSaver - Blood Donation Mobile App

A comprehensive React Native (Expo) mobile application for blood donation management, connecting donors, patients, and healthcare organizations to save lives.

## 🩸 Features

### Core Functionality
- **User Authentication**: Role-based authentication (Donor/Patient/NGO) with Firebase Auth
- **Blood Camp Discovery**: Find nearby blood donation camps with map and list views
- **Blood Request Management**: Create and respond to urgent blood requests
- **Donor Registration**: Complete donor profile with blood group, availability, and location
- **Donation Tracking**: Track donation history and next eligible donation date
- **Push Notifications**: Real-time alerts for blood requests and nearby camps
- **Awareness Center**: Educational content about blood donation benefits, FAQs, and myth-busting

### User Roles
1. **Donors**: Register, manage availability, track donations, respond to requests
2. **Patients/Families**: Create blood requests, view responses from donors
3. **NGOs/Hospitals**: Post blood camps, manage requests, organize donation drives

### Technical Features
- **Firebase Integration**: Authentication, Firestore database, Cloud Messaging
- **Google Maps**: Location-based services for camps and donor matching
- **Real-time Updates**: Live updates for requests, camps, and donor responses
- **Offline Support**: Basic functionality available offline
- **Clean UI/UX**: Modern red/white theme with intuitive navigation

## 🛠 Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging)
- **Maps**: Google Maps API
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **UI Components**: React Native Elements, Vector Icons
- **State Management**: React Context API
- **Notifications**: Expo Notifications

## 📱 Screen Structure

### Bottom Tab Navigation
1. **Home**: Nearby blood camps (map/list view), emergency requests
2. **Find Blood**: Browse and create blood requests with filters
3. **Become Donor**: Donor registration and profile management
4. **Tracker**: Donation history and eligibility tracking
5. **Awareness**: Educational content about blood donation

### Additional Screens
- Authentication (Login/Register)
- Profile Management
- Blood Camp Details
- Blood Request Details

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI (`npm install -g expo-cli`)
- Firebase project setup
- Google Maps API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd lifesaver-blood-donation
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Cloud Messaging
   - Download the configuration file
   - Update `config/firebase.js` with your Firebase config

4. **Google Maps Setup**
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com)
   - Enable Maps SDK for Android/iOS
   - Add the API key to your app configuration

5. **Start the development server**
```bash
npm start
```

### Firebase Setup

#### Authentication
- Enable Email/Password authentication
- Configure sign-in methods as needed

#### Firestore Collections

```javascript
// Users Collection
users: {
  uid: string,
  email: string,
  fullName: string,
  phone: string,
  role: 'donor' | 'patient' | 'ngo',
  bloodGroup?: string,
  isAvailable?: boolean,
  location?: {
    latitude: number,
    longitude: number,
    address: string
  },
  organizationName?: string,
  organizationType?: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Blood Camps Collection
blood_camps: {
  name: string,
  organizer: string,
  date: string,
  startTime: string,
  endTime: string,
  address: string,
  location: {
    latitude: number,
    longitude: number
  },
  contactNumber: string,
  description?: string,
  status: 'active' | 'completed' | 'cancelled',
  registeredDonors: string[],
  registrationCount: number,
  createdAt: timestamp
}

// Blood Requests Collection
blood_requests: {
  patientName: string,
  bloodGroup: string,
  unitsNeeded: string,
  priority: 'normal' | 'urgent' | 'emergency',
  hospital: string,
  contactNumber: string,
  requiredDate: string,
  description?: string,
  createdBy: string,
  creatorName: string,
  status: 'active' | 'fulfilled' | 'cancelled',
  responses: number,
  createdAt: timestamp,
  updatedAt: timestamp
}

// Donations Collection
donations: {
  donorId: string,
  donorName: string,
  donorBloodGroup: string,
  date: string,
  location: string,
  units: string,
  type: 'whole_blood' | 'platelets' | 'plasma' | 'red_cells',
  organization?: string,
  notes?: string,
  createdAt: timestamp
}
```

#### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Blood camps are readable by all, writable by NGOs
    match /blood_camps/{campId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ngo';
    }
    
    // Blood requests are readable by all, writable by patients/NGOs
    match /blood_requests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['patient', 'ngo'] ||
         resource.data.createdBy == request.auth.uid);
    }
    
    // Donations are readable/writable by the donor
    match /donations/{donationId} {
      allow read, write: if request.auth != null && 
        resource.data.donorId == request.auth.uid;
    }
  }
}
```

## 🎨 UI/UX Design

### Theme
- **Primary Color**: Crimson Red (#DC143C)
- **Secondary Color**: Light Red (#FF6B6B)
- **Background**: White (#FFFFFF)
- **Text**: Dark Gray (#2C3E50)
- **Success**: Green (#27AE60)
- **Warning**: Orange (#F39C12)
- **Error**: Red (#E74C3C)

### Design Principles
- Clean and intuitive interface
- Consistent spacing and typography
- Accessibility-first approach
- Mobile-optimized touch targets
- Clear visual hierarchy

## 📱 Key Features Implementation

### Real-time Notifications
```javascript
// Push notifications for blood requests
const sendBloodRequestNotification = async (bloodGroup, location) => {
  // Send to compatible donors in the area
  const donors = await getDonorsByBloodGroupAndLocation(bloodGroup, location);
  
  donors.forEach(donor => {
    sendPushNotification(donor.pushToken, {
      title: 'Urgent Blood Request',
      body: `${bloodGroup} blood needed in your area`,
      data: { type: 'blood_request', bloodGroup, location }
    });
  });
};
```

### Location-based Matching
```javascript
// Find nearby blood camps
const getNearbyBloodCamps = async (userLocation, radius = 10) => {
  const camps = await firestore()
    .collection('blood_camps')
    .where('status', '==', 'active')
    .get();
    
  return camps.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(camp => {
      const distance = calculateDistance(
        userLocation,
        camp.location
      );
      return distance <= radius;
    })
    .sort((a, b) => 
      calculateDistance(userLocation, a.location) - 
      calculateDistance(userLocation, b.location)
    );
};
```

### Donation Eligibility Tracking
```javascript
// Calculate next eligible donation date
const calculateNextEligibleDate = (lastDonation, donationType) => {
  const lastDate = new Date(lastDonation.date);
  const intervals = {
    whole_blood: 56, // 8 weeks
    platelets: 7,    // 1 week
    plasma: 28,      // 4 weeks
    red_cells: 112   // 16 weeks
  };
  
  const nextDate = new Date(lastDate);
  nextDate.setDate(lastDate.getDate() + intervals[donationType]);
  
  return nextDate;
};
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id
```

### App Configuration
Update `app.json` with your project details:
```json
{
  "expo": {
    "name": "LifeSaver - Blood Donation",
    "slug": "lifesaver-blood-donation",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.lifesaver"
    },
    "android": {
      "package": "com.yourcompany.lifesaver"
    }
  }
}
```

## 🚀 Deployment

### Build for Production
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Or use EAS Build (recommended)
eas build --platform all
```

### App Store Submission
1. Test thoroughly on physical devices
2. Prepare app store assets (icons, screenshots, descriptions)
3. Submit to Google Play Store and Apple App Store
4. Follow platform-specific guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@lifesaver-app.com
- Documentation: [Wiki](wiki-link)

## 🙏 Acknowledgments

- Blood donation organizations for inspiration
- Firebase for backend infrastructure
- Expo team for the development platform
- React Native community for excellent libraries
- All contributors and beta testers

---

**LifeSaver** - *Connecting donors, saving lives* 🩸❤️
