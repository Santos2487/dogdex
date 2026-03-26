# **App Name**: DogExplorer

## Core Features:

- Onboarding Flow: Guide new users with a clear introduction to the app's features and benefits, highlighting dog breed collection, AI recognition, and private collections.
- Dog Breed Recognition: Utilize the Gemini multimodal API to automatically identify dog breeds from uploaded images or camera input, providing breed name and confidence score.
- Review Capture Details: Display the captured photo, detected breed, confidence score, capture date, and optional location for the user to review and edit. Allow manual breed selection if AI confidence is low.
- Collection Management: Enable users to organize and manage their collected dog breeds, including features like adding notes, marking favorites, and assigning rarity levels. Store collected data in Cloud Firestore.
- Progression System: Implement a point-based system for actions like new captures and rare breed identification. Increment the XP, Level and achievements using Firestore.
- Statistics Tracking: Display user stats such as total captures, unique breeds count, most common breed, and rarity distribution. Visualize level progress with a progress bar, stored in Cloud Firestore.
- Achievement Unlocks: Grant achievement badges automatically based on conditions met by the progression system and the stored data. Each achivement uses the cloud Firestore to store data about it.

## Style Guidelines:

- Primary color: Vivid yellow (#FFC72C), reminiscent of playful golden retrievers and providing a cheerful base.
- Background color: Very light yellow (#FAF8E7) creates a soft, inviting canvas that doesn't distract from the dog photos.
- Accent color: Orange (#FF934F) serves as a warm and engaging highlight for interactive elements.
- Font: 'Poppins', a geometric sans-serif font for both headings and body text, to maintain a precise, contemporary feel across the application.
- Use playful, custom icons to represent dog breeds and rarity levels. Ensure icons are intuitive and match the overall cheerful theme.
- Mobile-first layout with a grid system for displaying captured dog breeds. Use large touch targets and clear empty states to enhance user experience.
- Subtle animations when capturing new dogs or unlocking achievements to create a rewarding and engaging user experience.