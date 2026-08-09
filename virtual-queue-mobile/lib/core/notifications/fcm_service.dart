import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../firebase_options.dart';
import '../http/dio_client.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (_) {
    // Firebase may not be configured in local development.
  }
}

class FcmService {
  FcmService(this._dio, this._notifications);

  final Dio _dio;
  final FlutterLocalNotificationsPlugin _notifications;

  static Future<void> registerBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    return Future.value();
  }

  Future<void> init() async {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } catch (error) {
      debugPrint('Firebase no configurado: $error');
      return;
    }

    const androidChannel = AndroidNotificationChannel(
      'virtual_queue',
      'Virtual Queue',
      importance: Importance.high,
    );

    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission();

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await _notifications.initialize(initSettings);

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    final token = await messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }

    FirebaseMessaging.onMessage.listen((message) async {
      final notification = message.notification;
      if (notification == null) return;

      await _notifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'virtual_queue',
            'Virtual Queue',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    });

    FirebaseMessaging.instance.onTokenRefresh.listen(_registerToken);
  }

  Future<void> _registerToken(String fcmToken) async {
    try {
      await _dio.post(
        '/api/devices/register',
        data: {
          'fcmToken': fcmToken,
          'platform': defaultTargetPlatform == TargetPlatform.android
              ? 'ANDROID'
              : 'IOS',
        },
      );
    } catch (error) {
      debugPrint('No se pudo registrar el dispositivo FCM: $error');
    }
  }
}

final fcmServiceProvider = Provider<FcmService>((ref) {
  final dio = ref.watch(dioProvider);
  return FcmService(dio, FlutterLocalNotificationsPlugin());
});
