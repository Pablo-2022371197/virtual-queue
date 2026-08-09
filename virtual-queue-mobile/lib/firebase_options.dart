import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Firebase no está configurado para web en esta app.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      default:
        throw UnsupportedError(
          'Firebase no está configurado para $defaultTargetPlatform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyA2g5e_HEHKIQw6Km5NjJIsdnQ3vmz1alc',
    appId: '1:260037341883:android:96c51ffc6c0f5d9ce2ef9e',
    messagingSenderId: '260037341883',
    projectId: 'virtual-queue-f114a',
    storageBucket: 'virtual-queue-f114a.firebasestorage.app',
  );
}
